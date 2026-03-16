import { describe, expect, it } from 'vitest';
import { inferSanctionType, normalizeCollectedRecord } from './normalizer';

describe('inferSanctionType', () => {
  it('maps license revocation text to LICENSE_REVOCATION', () => {
    expect(inferSanctionType('영업허가 취소')).toBe('LICENSE_REVOCATION');
  });

  it('defaults to OTHER when no keyword exists', () => {
    expect(inferSanctionType('기타 조치')).toBe('OTHER');
  });
});

describe('normalizeCollectedRecord', () => {
  it('normalizes restaurant name/address and preserves source metadata', () => {
    const normalized = normalizeCollectedRecord({
      sourceType: 'PUBLIC_API',
      sourceName: 'food-safety-korea',
      record: {
        sourceRecordId: 'abc-123',
        businessName: '(주) 테스트치킨 강남점',
        address: '서울특별시 강남구  테헤란로 1',
        violationContent: '위생기준 위반',
      },
    });

    expect(normalized.sourceType).toBe('PUBLIC_API');
    expect(normalized.sourceName).toBe('food-safety-korea');
    expect(normalized.sourceRecordId).toBe('abc-123');
    expect(normalized.rawBusinessName).toBe('테스트치킨');
    expect(normalized.rawAddress).toBe('서울 강남구 테헤란로 1');
  });
});
