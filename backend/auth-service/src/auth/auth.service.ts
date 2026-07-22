import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Role, UserPayload, AuthResponse } from '@darkitchen/shared';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from './email.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  // ─── REGISTER ─────────────────────────────────────────
  async register(dto: RegisterDto): Promise<AuthResponse> {
    this.validatePasswordStrength(dto.password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new HttpException(
        'A user with this email already exists',
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verificationToken = randomUUID();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: 'CLIENT',
        verificationToken,
        isVerified: false,
      },
    });

    // Enviar el correo de verificación sin bloquear la respuesta
    this.emailService.sendVerificationEmail(user.email, verificationToken).catch(e => {
      this.logger.error('Error sending verification email during registration', e);
    });

    // Nota: Como ahora requerimos verificación, no devolvemos el token de acceso aquí.
    // El frontend debería redirigir a una pantalla de "revisa tu correo" y no hacer auto-login.
    // Devolvemos el payload sin token, o un authResponse modificado.
    const payload = this.mapToUserPayload(user);

    await this.publishAuditEvent({
      userId: user.id,
      action: 'REGISTER',
      resource: 'auth',
      status: 'SUCCESS',
      details: 'Pending email verification',
    });

    return { token: '', user: payload };
  }

  // ─── LOGIN ────────────────────────────────────────────
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.isVerified) {
      throw new HttpException(
        'Please verify your email before logging in. Check your inbox.',
        HttpStatus.FORBIDDEN,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      await this.publishAuditEvent({
        userId: user.id,
        action: 'LOGIN',
        resource: 'auth',
        status: 'FAILED',
        details: 'Invalid password',
      });

      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload = this.mapToUserPayload(user);
    const token = this.generateToken(user);

    await this.publishAuditEvent({
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      status: 'SUCCESS',
    });

    return { token, user: payload };
  }

  // ─── GET PROFILE ──────────────────────────────────────
  async getProfile(userId: number): Promise<UserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return this.mapToUserPayload(user);
  }

  // ─── GET ALL USERS ────────────────────────────────────
  async getAllUsers(): Promise<UserPayload[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return users.map(user => this.mapToUserPayload(user));
  }

  // ─── CHANGE PASSWORD ─────────────────────────────────
  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);

    if (!isOldPasswordValid) {
      throw new HttpException(
        'Current password is incorrect',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.validatePasswordStrength(dto.newPassword);

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.publishAuditEvent({
      userId,
      action: 'CHANGE_PASSWORD',
      resource: 'auth',
      status: 'SUCCESS',
    });

    return { message: 'Password changed successfully' };
  }

  // ─── FORGOT PASSWORD ─────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal whether a user exists
      return { message: 'If the email exists, a reset token has been generated' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password-reset' },
      { expiresIn: '30m' },
    );

    // In production, send this via email
    console.log(`🔑 Password reset token for ${user.email}: ${resetToken}`);

    await this.publishAuditEvent({
      userId: user.id,
      action: 'FORGOT_PASSWORD',
      resource: 'auth',
      status: 'SUCCESS',
    });

    return { message: 'If the email exists, a reset token has been generated' };
  }

  // ─── RESET PASSWORD ──────────────────────────────────
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    let decoded: { sub: number; email: string; type: string };

    try {
      decoded = this.jwtService.verify(dto.token);
    } catch {
      throw new HttpException(
        'Invalid or expired reset token',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (decoded.type !== 'password-reset') {
      throw new HttpException(
        'Invalid token type',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.validatePasswordStrength(dto.newPassword);

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: decoded.sub },
      data: { password: hashedPassword },
    });

    await this.publishAuditEvent({
      userId: decoded.sub,
      action: 'RESET_PASSWORD',
      resource: 'auth',
      status: 'SUCCESS',
    });

    return { message: 'Password has been reset successfully' };
  }

  // ─── REFRESH TOKEN ────────────────────────────────────
  async refresh(userId: number): Promise<{ token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const token = this.generateToken(user);

    return { token };
  }

  // ─── VALIDATE GOOGLE USER ────────────────────────────
  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<AuthResponse> {
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId },
        });
      } else {
        // Create new user from Google profile
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            googleId: profile.googleId,
            password: '', // No password for Google users
            role: 'CLIENT',
            isVerified: true, // Auto-verificado
          },
        });
      }
    }

    const payload = this.mapToUserPayload(user);
    const token = this.generateToken(user);

    await this.publishAuditEvent({
      userId: user.id,
      action: 'GOOGLE_LOGIN',
      resource: 'auth',
      status: 'SUCCESS',
    });

    return { token, user: payload };
  }

  // ─── VERIFY EMAIL ──────────────────────────────────────
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new HttpException('Invalid or expired verification token', HttpStatus.BAD_REQUEST);
    }

    if (user.isVerified) {
      return { message: 'Email is already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    await this.publishAuditEvent({
      userId: user.id,
      action: 'VERIFY_EMAIL',
      resource: 'auth',
      status: 'SUCCESS',
    });

    return { message: 'Email verified successfully' };
  }

  // ─── PRIVATE HELPERS ─────────────────────────────────
  private generateToken(user: {
    id: number;
    email: string;
    name: string;
    role: string;
  }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }

  private mapToUserPayload(user: {
    id: number;
    email: string;
    name: string;
    role: string;
  }): UserPayload {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    };
  }

  private validatePasswordStrength(password: string): void {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if (!strongPasswordRegex.test(password)) {
      throw new HttpException(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async publishAuditEvent(event: {
    userId?: number;
    action: string;
    resource: string;
    status: string;
    details?: string;
  }): Promise<void> {
    try {
      await this.redisService.publish(
        'audit:events',
        JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      this.logger.error('Failed to publish audit event', error);
    }
  }
}
