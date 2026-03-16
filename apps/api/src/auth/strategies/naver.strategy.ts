import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import { SocialUserProfile } from './kakao.strategy';

@Injectable()
export class NaverStrategy {
  constructor(private readonly configService: ConfigService) {}

  async authenticate(code: string, state?: string): Promise<SocialUserProfile> {
    const clientId = this.configService.getOrThrow<string>('NAVER_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('NAVER_CLIENT_SECRET');

    const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token');
    tokenUrl.searchParams.set('grant_type', 'authorization_code');
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('code', code);
    if (state) {
      tokenUrl.searchParams.set('state', state);
    }

    const tokenResponse = await fetch(tokenUrl);
    if (!tokenResponse.ok) {
      throw new UnauthorizedException('네이버 OAuth 토큰 교환에 실패했습니다');
    }

    const tokenJson = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      throw new UnauthorizedException('네이버 access token이 없습니다');
    }

    const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedException('네이버 사용자 정보 조회에 실패했습니다');
    }

    const profileJson = (await profileResponse.json()) as {
      response?: {
        id?: string;
        email?: string;
        name?: string;
        nickname?: string;
      };
    };

    const providerId = profileJson.response?.id;
    const email = profileJson.response?.email;

    if (!providerId || !email) {
      throw new UnauthorizedException('네이버 사용자 정보가 유효하지 않습니다');
    }

    return {
      provider: AuthProvider.NAVER,
      providerId,
      email,
      name: profileJson.response?.name ?? profileJson.response?.nickname,
    };
  }
}
