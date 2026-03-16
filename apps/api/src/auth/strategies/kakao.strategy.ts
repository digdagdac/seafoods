import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';

export interface SocialUserProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name?: string;
}

@Injectable()
export class KakaoStrategy {
  constructor(private readonly configService: ConfigService) {}

  async authenticate(code: string): Promise<SocialUserProfile> {
    const clientId = this.configService.getOrThrow<string>('KAKAO_CLIENT_ID');
    const clientSecret = this.configService.get<string>('KAKAO_CLIENT_SECRET');
    const redirectUri = this.configService.getOrThrow<string>('KAKAO_CALLBACK_URL');

    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret ?? '',
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('카카오 OAuth 토큰 교환에 실패했습니다');
    }

    const tokenJson = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      throw new UnauthorizedException('카카오 access token이 없습니다');
    }

    const profileResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedException('카카오 사용자 정보 조회에 실패했습니다');
    }

    const profileJson = (await profileResponse.json()) as {
      id?: number;
      kakao_account?: { email?: string; profile?: { nickname?: string } };
    };

    const providerId = profileJson.id ? String(profileJson.id) : undefined;
    const email = profileJson.kakao_account?.email;

    if (!providerId || !email) {
      throw new UnauthorizedException('카카오 사용자 정보가 유효하지 않습니다');
    }

    return {
      provider: AuthProvider.KAKAO,
      providerId,
      email,
      name: profileJson.kakao_account?.profile?.nickname,
    };
  }
}
