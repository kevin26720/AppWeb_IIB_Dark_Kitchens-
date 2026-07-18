import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || 'placeholder-client-id';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || 'placeholder-client-secret';
    const callbackURL = configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:4000/api/auth/google/callback',
    );

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });

    if (clientID === 'placeholder-client-id') {
      this.logger.warn(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { id, emails, displayName } = profile;

      const email = emails && emails.length > 0 ? emails[0].value : '';
      const name = displayName || 'Google User';

      const result = await this.authService.validateGoogleUser({
        googleId: id,
        email,
        name,
      });

      done(null, result);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
