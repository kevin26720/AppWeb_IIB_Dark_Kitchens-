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

  // Registro y acceso son solo fachadas HTTP; la logica real vive en AuthService.
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

  // El perfil se resuelve con la identidad que el gateway inyecto en los headers.
  @Get('profile')
  async getProfile(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.authService.getProfile(userId);
  }

  // Solo administradores pueden listar todos los usuarios.
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

  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    if (!token) {
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
    }
    return this.authService.verifyEmail(token);
  }

  // GoogleAuthGuard redirige al flujo OAuth de Google.
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  // La callback recibe el usuario validado y redirige al frontend con el JWT.
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { token: string; user: { id: number } };
    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/auth/callback?token=${user.token}`);
  }

  private parseUserId(userIdHeader: string): number {
    // Los headers del gateway viajan como texto; aqui se validan antes de usar la BD.
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
