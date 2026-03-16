import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  loginRequestSchema,
  providerParamSchema,
  refreshTokenRequestSchema,
  signupRequestSchema,
  socialLoginRequestSchema,
  updateProfileRequestSchema,
  LoginRequestDto,
  SignupRequestDto,
  RefreshTokenRequestDto,
  SocialLoginRequestDto,
  UpdateProfileRequestDto,
} from './dto/auth.dto';
import { ZodValidationPipe } from './dto/zod-validation.pipe';
import { LoginRateLimiterService } from './login-rate-limiter.service';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginRateLimiterService: LoginRateLimiterService,
    private readonly kakaoStrategy: KakaoStrategy,
    private readonly naverStrategy: NaverStrategy,
    private readonly googleStrategy: GoogleStrategy,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: '이메일 회원가입' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        name: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '회원가입 성공, access/refresh 토큰 반환' })
  @ApiResponse({ status: 409, description: '이메일 중복' })
  signup(@Body(new ZodValidationPipe(signupRequestSchema)) body: SignupRequestDto) {
    return this.authService.signup(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 로그인' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequestDto,
    @Req() req: Request,
  ) {
    return this.withLoginRateLimit(req, body.email, () => this.authService.login(body));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'refresh token으로 토큰 재발급' })
  refresh(
    @Body(new ZodValidationPipe(refreshTokenRequestSchema))
    body: RefreshTokenRequestDto,
  ) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃 (refresh token 무효화)' })
  logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.id);
  }

  @Post('social/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '소셜 로그인 (카카오/네이버/구글)' })
  socialLogin(
    @Param('provider') provider: string,
    @Body(new ZodValidationPipe(socialLoginRequestSchema)) body: SocialLoginRequestDto,
  ) {
    return this.runSocialLogin(provider, body.code, body.state);
  }

  @Get('social/:provider/callback')
  @ApiOperation({ summary: '소셜 로그인 콜백 엔드포인트' })
  socialCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state?: string,
  ) {
    const parsed = socialLoginRequestSchema.safeParse({ code, state });
    if (!parsed.success) {
      throw new BadRequestException('OAuth callback 파라미터가 유효하지 않습니다');
    }
    return this.runSocialLogin(provider, parsed.data.code, parsed.data.state);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '사용자 프로필' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 프로필 수정' })
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateProfileRequestSchema)) body: UpdateProfileRequestDto,
  ) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 탈퇴' })
  deleteMe(@Req() req: AuthenticatedRequest) {
    return this.authService.deleteMe(req.user.id);
  }

  private async runSocialLogin(providerParam: string, code: string, state?: string) {
    const parsed = providerParamSchema.safeParse(providerParam.toUpperCase());
    if (!parsed.success) {
      throw new BadRequestException('지원하지 않는 소셜 로그인 제공자입니다');
    }
    const provider = parsed.data;

    if (provider === 'KAKAO') {
      const profile = await this.kakaoStrategy.authenticate(code);
      return this.authService.socialLogin(profile);
    }

    if (provider === 'NAVER') {
      const profile = await this.naverStrategy.authenticate(code, state);
      return this.authService.socialLogin(profile);
    }

    const profile = await this.googleStrategy.authenticate(code);
    return this.authService.socialLogin(profile);
  }

  private async withLoginRateLimit(
    req: Request,
    email: string,
    loginFn: () => Promise<unknown>,
  ) {
    const key = `${req.ip ?? 'unknown'}:${email.toLowerCase()}`;
    this.loginRateLimiterService.checkOrThrow(key);

    try {
      const result = await loginFn();
      this.loginRateLimiterService.registerSuccess(key);
      return result;
    } catch (error) {
      this.loginRateLimiterService.registerFailure(key);
      throw error;
    }
  }
}
