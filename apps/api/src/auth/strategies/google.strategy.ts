import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import { SocialUserProfile } from './kakao.strategy';

@Injectable()
export class GoogleStrategy {
  constructor(private readonly configService: ConfigService) {}

  async authenticate(code: string): Promise<SocialUserProfile> {
    const clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:3000/api/v1/auth/social/google/callback',
    );

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('구글 OAuth 토큰 교환에 실패했습니다');
    }

    const tokenJson = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      throw new UnauthorizedException('구글 access token이 없습니다');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedException('구글 사용자 정보 조회에 실패했습니다');
    }

    const profileJson = (await profileResponse.json()) as {
      id?: string;
      email?: string;
      name?: string;
    };

    if (!profileJson.id || !profileJson.email) {
      throw new UnauthorizedException('구글 사용자 정보가 유효하지 않습니다');
    }

    return {
      provider: AuthProvider.GOOGLE,
      providerId: profileJson.id,
      email: profileJson.email,
      name: profileJson.name,
    };
  }
}
