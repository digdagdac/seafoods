import { describe, expect, it } from 'vitest';
import { computeTextSimilarity, scoreCandidate } from './matcher';

describe('computeTextSimilarity', () => {
  it('returns 1 for exact text', () => {
    expect(computeTextSimilarity('교촌치킨', '교촌치킨')).toBe(1);
  });

  it('returns lower score for weak match', () => {
    const score = computeTextSimilarity('교촌치킨', '마라탕집');
    expect(score).toBeLessThan(0.5);
  });
});

describe('scoreCandidate', () => {
  it('prioritizes exact name+address match', () => {
    const score = scoreCandidate(
      {
        name: '교촌치킨 강남',
        address: '서울 강남구 역삼동 123',
      },
      {
        name: '교촌치킨 강남',
        address: '서울 강남구 역삼동 123',
      },
    );

    expect(score).toBeGreaterThan(0.95);
  });
});
