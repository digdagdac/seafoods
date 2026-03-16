import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface AttemptState {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

@Injectable()
export class LoginRateLimiterService {
  private readonly attempts = new Map<string, AttemptState>();
  private readonly windowMs = 15 * 60 * 1000;
  private readonly maxAttempts = 5;
  private readonly blockMs = 15 * 60 * 1000;

  checkOrThrow(key: string) {
    const now = Date.now();
    const state = this.attempts.get(key);

    if (!state) {
      return;
    }

    if (state.blockedUntil && state.blockedUntil > now) {
      const retryAfter = Math.ceil((state.blockedUntil - now) / 1000);
      throw new HttpException(`로그인 시도가 너무 많습니다. ${retryAfter}초 후 다시 시도해 주세요`, HttpStatus.TOO_MANY_REQUESTS);
    }

    if (now - state.firstAttemptAt > this.windowMs) {
      this.attempts.delete(key);
    }
  }

  registerFailure(key: string) {
    const now = Date.now();
    const current = this.attempts.get(key);

    if (!current || now - current.firstAttemptAt > this.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttemptAt: now,
        blockedUntil: null,
      });
      return;
    }

    const nextCount = current.count + 1;
    const blockedUntil = nextCount >= this.maxAttempts ? now + this.blockMs : null;

    this.attempts.set(key, {
      count: nextCount,
      firstAttemptAt: current.firstAttemptAt,
      blockedUntil,
    });
  }

  registerSuccess(key: string) {
    this.attempts.delete(key);
  }
}
