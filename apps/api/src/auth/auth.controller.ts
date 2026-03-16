import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthProvider } from '@prisma/client';

class SignupBody {
  email!: string;
  password!: string;
  name?: string;
}

class LoginBody {
  email!: string;
  password!: string;
}

class SocialLoginBody {
  provider!: AuthProvider;
  providerId!: string;
  email!: string;
  name?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: '이메일 회원가입' })
  @ApiBody({ type: SignupBody })
  @ApiResponse({ status: 201, description: '회원가입 성공, JWT 토큰 반환' })
  @ApiResponse({ status: 409, description: '이메일 중복' })
  signup(@Body() body: SignupBody) {
    return this.authService.signup(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 로그인' })
  @ApiBody({ type: LoginBody })
  @ApiResponse({ status: 200, description: '로그인 성공, JWT 토큰 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  login(@Body() body: LoginBody) {
    return this.authService.login(body);
  }

  @Post('social')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '소셜 로그인 (카카오 등)' })
  @ApiBody({ type: SocialLoginBody })
  @ApiResponse({ status: 200, description: '소셜 로그인 성공' })
  socialLogin(@Body() body: SocialLoginBody) {
    return this.authService.socialLogin(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '사용자 프로필' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }
}
