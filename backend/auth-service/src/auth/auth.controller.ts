import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.authService.refresh(userId);
  }

  @Get('profile')
  async getProfile(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.authService.getProfile(userId);
  }

  @Get('users')
  async getAllUsers(@Headers('x-user-role') roleHeader: string) {
    if (roleHeader !== 'ADMIN') {
      throw new HttpException('Only admins can access all users', HttpStatus.FORBIDDEN);
    }
    return this.authService.getAllUsers();
  }

  @Post('change-password')
  async changePassword(
    @Headers('x-user-id') userIdHeader: string,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = this.parseUserId(userIdHeader);
    return this.authService.changePassword(userId, dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { token: string; user: { id: number } };
    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/auth/callback?token=${user.token}`);
  }

  private parseUserId(userIdHeader: string): number {
    if (!userIdHeader) {
      throw new HttpException(
        'Missing X-User-Id header',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(userIdHeader, 10);

    if (isNaN(userId)) {
      throw new HttpException(
        'Invalid X-User-Id header',
        HttpStatus.BAD_REQUEST,
      );
    }

    return userId;
  }
}
