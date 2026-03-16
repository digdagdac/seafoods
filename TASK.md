# Task: 인증/소셜로그인 완성

## 브랜치: feature/auth-social
## 역할: Backend Developer

### 목표
JWT 인증 플로우 + 카카오/네이버/구글 소셜 로그인 완성

### 구현 요구사항

1. **JWT 인증 완성**
   - `apps/api/src/auth/auth.service.ts` - Access + Refresh 토큰 발급
   - `apps/api/src/auth/dto/` - 요청/응답 DTO (Zod validation)
   - 토큰 갱신 API (POST /auth/refresh)
   - 로그아웃 (refresh token 무효화)

2. **소셜 로그인 구현**
   - `apps/api/src/auth/strategies/kakao.strategy.ts` - 카카오 OAuth2
   - `apps/api/src/auth/strategies/naver.strategy.ts` - 네이버 OAuth2
   - `apps/api/src/auth/strategies/google.strategy.ts` - 구글 OAuth2
   - 공통: 첫 로그인 시 자동 회원가입 (upsert)

3. **사용자 프로필**
   - GET /auth/me - 프로필 조회
   - PATCH /auth/me - 프로필 수정 (이름, 알림 설정)
   - DELETE /auth/me - 회원 탈퇴 (soft delete or cascade)

4. **보안**
   - bcrypt 비밀번호 해싱
   - Rate limiting (로그인 시도 제한)
   - CORS 설정 강화

### 참조
- .env.example의 OAuth 관련 환경변수
- prisma/schema.prisma User, AuthProvider 모델

### 작업 완료 후
- git add && git commit -m "feat(auth): JWT + 소셜로그인 구현"
