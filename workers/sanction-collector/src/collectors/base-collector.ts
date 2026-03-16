export interface CollectorRecord {
  sourceRecordId?: string;
  businessName?: string;
  address?: string;
  dispositionDate?: string | Date;
  violationContent?: string;
  dispositionContent?: string;
  legalBasis?: string;
  sanctionTypeRaw?: string;
  [key: string]: unknown;
}

export interface CollectParams {
  page?: number;
  pageSize?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface SanctionCollector {
  readonly sourceType: string;
  readonly sourceName: string;
  collect(params?: CollectParams): Promise<CollectorRecord[]>;
}

export interface FetchLikeResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
  },
) => Promise<FetchLikeResponse>;

export abstract class BaseCollector implements SanctionCollector {
  abstract readonly sourceType: string;
  abstract readonly sourceName: string;

  protected constructor(protected readonly fetchLike: FetchLike = getFetchLike()) {}

  abstract collect(params?: CollectParams): Promise<CollectorRecord[]>;

  protected async getJson(url: string): Promise<unknown> {
    const response = await this.fetchLike(url, { method: 'GET' });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `[${this.sourceName}] request failed (${response.status}): ${body}`,
      );
    }

    return response.json();
  }

  protected pickString(
    row: Record<string, unknown>,
    candidates: string[],
  ): string | undefined {
    for (const key of candidates) {
      const value = row[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
      if (typeof value === 'number') {
        return String(value);
      }
    }

    return undefined;
  }

  protected toRows(payload: unknown): Record<string, unknown>[] {
    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const obj = payload as Record<string, unknown>;
    const candidates: unknown[] = [
      obj.data,
      obj.items,
      obj.records,
      obj.result,
      obj.RESULT,
      (obj.response as Record<string, unknown> | undefined)?.body,
      (obj.response as Record<string, unknown> | undefined)?.data,
      (obj.body as Record<string, unknown> | undefined)?.items,
      (obj.body as Record<string, unknown> | undefined)?.data,
    ];

    for (const candidate of candidates) {
      const rows = extractRows(candidate);
      if (rows.length > 0) {
        return rows;
      }
    }

    return [];
  }
}

function getFetchLike(): FetchLike {
  const maybeFetch = (globalThis as { fetch?: FetchLike }).fetch;

  if (!maybeFetch) {
    throw new Error('Global fetch is not available. Use Node.js 18+ runtime.');
  }

  return maybeFetch;
}

function extractRows(input: unknown): Record<string, unknown>[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.filter(isRecord);
  }

  if (!isRecord(input)) {
    return [];
  }

  if (Array.isArray(input.item)) {
    return input.item.filter(isRecord);
  }

  if (isRecord(input.items) && Array.isArray(input.items.item)) {
    return input.items.item.filter(isRecord);
  }

  if (Array.isArray(input.row)) {
    return input.row.filter(isRecord);
  }

  if (Array.isArray(input.data)) {
    return input.data.filter(isRecord);
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
