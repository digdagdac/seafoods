import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider } from '@prisma/client';

export interface SignupDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface SocialLoginDto {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
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
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const token = this.issueToken(user.id, user.email);

    return { user, token };
  }

  async login(dto: LoginDto) {
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

    const token = this.issueToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async socialLogin(dto: SocialLoginDto) {
    // Find by provider + providerId first
    let user = await this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider: dto.provider,
          providerId: dto.providerId,
        },
      },
    });

    if (!user) {
      // Check if email already exists
      const byEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (byEmail) {
        // Link provider to existing account
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            provider: dto.provider,
            providerId: dto.providerId,
          },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: dto.email,
            name: dto.name,
            provider: dto.provider,
            providerId: dto.providerId,
          },
        });
      }
    }

    const token = this.issueToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
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

  private issueToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    };
  }
}
