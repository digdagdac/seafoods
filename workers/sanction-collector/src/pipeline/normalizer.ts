import { SanctionType } from '@prisma/client';
import { normalizeAddress, normalizeRestaurantName } from '@safedeliver/utils';
import { CollectorRecord } from '../collectors/base-collector';

export interface NormalizerInput {
  sourceType: string;
  sourceName: string;
  record: CollectorRecord;
}

export interface RawSanctionInput {
  sourceType: string;
  sourceName: string;
  sourceRecordId: string | null;
  rawData: Record<string, unknown>;
  rawBusinessName: string | null;
  rawAddress: string | null;
}

export function normalizeCollectedRecord(input: NormalizerInput): RawSanctionInput {
  const businessName = sanitizeText(input.record.businessName);
  const address = sanitizeText(input.record.address);

  const normalizedName = businessName
    ? normalizeRestaurantName(businessName).normalized
    : null;
  const normalizedAddress = address ? normalizeAddress(address) : null;

  return {
    sourceType: input.sourceType,
    sourceName: input.sourceName,
    sourceRecordId: sanitizeText(input.record.sourceRecordId),
    rawData: sanitizeRawRecord(input.record),
    rawBusinessName: normalizedName,
    rawAddress: normalizedAddress,
  };
}

export function inferSanctionType(raw: string | null | undefined): SanctionType {
  if (!raw) {
    return SanctionType.OTHER;
  }

  const text = raw.replace(/\s+/g, '');

  if (/허가취소|등록취소|면허취소/.test(text)) {
    return SanctionType.LICENSE_REVOCATION;
  }

  if (/영업정지|업무정지|영업중지/.test(text)) {
    return SanctionType.LICENSE_SUSPENSION;
  }

  if (/개선명령|시정명령/.test(text)) {
    return SanctionType.IMPROVEMENT_ORDER;
  }

  if (/과태료|과징금|벌금/.test(text)) {
    return SanctionType.FINE;
  }

  if (/경고|주의/.test(text)) {
    return SanctionType.WARNING;
  }

  if (/폐쇄|영업소폐쇄|폐업명령/.test(text)) {
    return SanctionType.CLOSURE_ORDER;
  }

  return SanctionType.OTHER;
}

export function parseDispositionDate(
  value: unknown,
  fallback: Date = new Date(),
): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const raw = value.trim();
  if (!raw) {
    return fallback;
  }

  if (/^\d{8}$/.test(raw)) {
    const yyyy = raw.slice(0, 4);
    const mm = raw.slice(4, 6);
    const dd = raw.slice(6, 8);
    const parsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00+09:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const normalized = raw.replace(/\./g, '-').replace(/\//g, '-');
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function sanitizeRawRecord(record: CollectorRecord): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) {
      continue;
    }
    output[key] = value;
  }

  return output;
}

function sanitizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
