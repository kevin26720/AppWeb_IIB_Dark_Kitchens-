import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not defined. Email sending will be mocked or will fail.');
    }
    // Si no hay API key, inicializamos Resend con un valor temporal o lanzamos un error dependiendo del entorno.
    this.resend = new Resend(apiKey || 're_dummy_key');
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #472a00; text-align: center;">¡Bienvenido a DarkKitchen! 🍳</h2>
        <p style="font-size: 16px; color: #333;">Hola,</p>
        <p style="font-size: 16px; color: #333;">Gracias por registrarte. Para comenzar a pedir tus platillos favoritos, por favor verifica tu cuenta de correo electrónico haciendo clic en el siguiente botón:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verificar mi cuenta</a>
        </div>
        <p style="font-size: 14px; color: #666;">O si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="font-size: 14px; color: #4285F4; word-break: break-all;">${verificationUrl}</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Si tú no solicitaste este registro, por favor ignora este correo.</p>
      </div>
    `;

    try {
      if (this.configService.get<string>('RESEND_API_KEY')) {
        await this.resend.emails.send({
          from: 'DarkKitchen <onboarding@resend.dev>',
          to: email,
          subject: 'Confirma tu cuenta en DarkKitchen',
          html,
        });
        this.logger.log(`Verification email sent to ${email}`);
      } else {
        this.logger.log(`Mock: Verification email meant for ${email} with link: ${verificationUrl}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #472a00; text-align: center;">Restablece tu contraseña 🔑</h2>
        <p style="font-size: 16px; color: #333;">Hola,</p>
        <p style="font-size: 16px; color: #333;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en DarkKitchen. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Restablecer contraseña</a>
        </div>
        <p style="font-size: 14px; color: #666;">Este enlace expirará en <strong>30 minutos</strong>.</p>
        <p style="font-size: 14px; color: #666;">O copia y pega este enlace en tu navegador:</p>
        <p style="font-size: 14px; color: #4285F4; word-break: break-all;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Si tú no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.</p>
      </div>
    `;

    try {
      if (this.configService.get<string>('RESEND_API_KEY')) {
        await this.resend.emails.send({
          from: 'DarkKitchen <onboarding@resend.dev>',
          to: email,
          subject: 'Restablece tu contraseña en DarkKitchen',
          html,
        });
        this.logger.log(`Password reset email sent to ${email}`);
      } else {
        this.logger.log(`Mock: Password reset email for ${email} → ${resetUrl}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw error;
    }
  }
}
