import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginRequestDto,
  SignupRequestDto,
  UpdateProfileRequestDto,
} from './dto/auth.dto';
import { SocialUserProfile } from './strategies/kakao.strategy';

interface TokenPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(dto: SignupRequestDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    const tokens = await this.issueTokensAndStoreRefresh(user.id, user.email);

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  async login(dto: LoginRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const tokens = await this.issueTokensAndStoreRefresh(user.id, user.email);

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  async socialLogin(profile: SocialUserProfile) {
    const user = await this.upsertSocialUser(profile);
    const tokens = await this.issueTokensAndStoreRefresh(user.id, user.email);

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 refresh token입니다');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('유효하지 않은 refresh token입니다');
    }

    const hashedRefreshToken = await this.getHashedRefreshToken(user.id);
    if (!hashedRefreshToken) {
      throw new UnauthorizedException('로그아웃된 토큰입니다');
    }

    const matches = await bcrypt.compare(refreshToken, hashedRefreshToken);
    if (!matches) {
      throw new UnauthorizedException('refresh token 검증에 실패했습니다');
    }

    const tokens = await this.issueTokensAndStoreRefresh(user.id, user.email);

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  async logout(userId: string) {
    await this.setHashedRefreshToken(userId, null);
    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        notificationEnabled: true,
        notificationChannels: true,
        createdAt: true,
        _count: {
          select: {
            bookmarks: true,
            alertSubscriptions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileRequestDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.notificationEnabled !== undefined
          ? { notificationEnabled: dto.notificationEnabled }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        notificationEnabled: true,
        notificationChannels: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async deleteMe(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  private async upsertSocialUser(profile: SocialUserProfile): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
    });

    if (user) {
      return user;
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (byEmail) {
      user = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          provider: profile.provider,
          providerId: profile.providerId,
          name: byEmail.name ?? profile.name,
        },
      });

      return user;
    }

    user = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        provider: profile.provider,
        providerId: profile.providerId,
      },
    });

    return user;
  }

  private async issueTokensAndStoreRefresh(userId: string, email: string) {
    const payload: TokenPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessExpiresIn(),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshExpiresIn(),
      }),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    await this.setHashedRefreshToken(userId, hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.getAccessExpiresIn(),
      refreshTokenExpiresIn: this.getRefreshExpiresIn(),
    };
  }

  private async setHashedRefreshToken(userId: string, hashedRefreshToken: string | null) {
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE users
        SET hashed_refresh_token = ${hashedRefreshToken},
            updated_at = NOW()
        WHERE id = ${userId}
      `,
    );
  }

  private async getHashedRefreshToken(userId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ hashed_refresh_token: string | null }>>(
      Prisma.sql`
        SELECT hashed_refresh_token
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `,
    );

    return rows[0]?.hashed_refresh_token ?? null;
  }

  private toAuthUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      notificationEnabled: user.notificationEnabled,
    };
  }

  private getAccessSecret() {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  private getAccessExpiresIn() {
    return this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  }

  private getRefreshSecret() {
    return this.configService.get<string>('JWT_REFRESH_SECRET', this.getAccessSecret());
  }

  private getRefreshExpiresIn() {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '14d');
  }

}
