import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID')!,
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET')!,
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL')!,
      profileFields: ['id', 'emails', 'name', 'picture'],
    } as const);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    
    const user = {
      providerId: id,
      email: emails?.[0]?.value,
      firstName: name?.givenName || name?.familyName?.split(' ')[0] || '',
      lastName: name?.familyName || name?.givenName?.split(' ')[1] || '',
      profileImage: photos?.[0]?.value,
      provider: 'facebook',
    };

    done(null, user);
  }
}
