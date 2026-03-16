import { AuthProvider } from '@prisma/client';
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다')
  .max(72, '비밀번호는 72자 이하여야 합니다');

const nameSchema = z
  .string()
  .trim()
  .min(1, '이름은 1자 이상이어야 합니다')
  .max(50, '이름은 50자 이하여야 합니다');

export const signupRequestSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해 주세요').transform((v) => v.toLowerCase()),
  password: passwordSchema,
  name: nameSchema.optional(),
});

export type SignupRequestDto = z.infer<typeof signupRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해 주세요').transform((v) => v.toLowerCase()),
  password: z.string().min(1, '비밀번호를 입력해 주세요'),
});

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken이 필요합니다'),
});

export type RefreshTokenRequestDto = z.infer<typeof refreshTokenRequestSchema>;

export const socialLoginRequestSchema = z.object({
  code: z.string().min(1, 'OAuth code가 필요합니다'),
  state: z.string().optional(),
});

export type SocialLoginRequestDto = z.infer<typeof socialLoginRequestSchema>;

export const updateProfileRequestSchema = z
  .object({
    name: nameSchema.optional(),
    notificationEnabled: z.boolean().optional(),
  })
  .refine((value) => value.name !== undefined || value.notificationEnabled !== undefined, {
    message: '수정할 필드를 하나 이상 전달해 주세요',
    path: [],
  });

export type UpdateProfileRequestDto = z.infer<typeof updateProfileRequestSchema>;

export const providerParamSchema = z.enum([
  AuthProvider.KAKAO,
  AuthProvider.NAVER,
  AuthProvider.GOOGLE,
]);

export type ProviderParamDto = z.infer<typeof providerParamSchema>;

export const authTokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessTokenExpiresIn: z.string(),
  refreshTokenExpiresIn: z.string(),
});

export const authUserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  provider: z.nativeEnum(AuthProvider).nullable(),
  notificationEnabled: z.boolean(),
});

export const authSuccessResponseSchema = z.object({
  user: authUserResponseSchema,
  tokens: authTokensResponseSchema,
});

export type AuthSuccessResponseDto = z.infer<typeof authSuccessResponseSchema>;
