/**
 * Shared utility for calling the data.go.kr 식품위생 행정처분 API (I2715).
 */

// ─── Raw API types ────────────────────────────────────────────────────────────

export interface I2715Row {
  BSSH_NM: string       // 업소명
  ADDR: string          // 주소
  VIOL_CN: string       // 위반내용
  DSPN_CN: string       // 처분내용
  DSPN_DT: string       // 처분일자 (YYYYMMDD)
  LCNS_NO: string       // 인허가번호 (사업자번호 등)
  INDUTYPE_NM: string   // 업종명
  AREA_NM: string       // 지역명
}

export interface I2715Result {
  CODE: string
  MESSAGE: string
}

export interface I2715Response {
  I2715: {
    total_count: string
    row?: I2715Row[]
    RESULT: I2715Result
  }
}

// ─── Mapped types ─────────────────────────────────────────────────────────────

export interface RestaurantItem {
  id: string
  name: string
  normalizedName: string
  category: string
  roadAddress: string | null
  jibunAddress: string | null
  latitude: number | null
  longitude: number | null
  regionCode: string
  status: string
  totalSanctions: number
  lastSanctionAt: string | null
}

export interface SanctionItem {
  id: string
  sanctionType: string
  severity: string
  violationContent: string
  dispositionContent: string
  dispositionDate: string
  restaurant: { id: string; name: string; category: string }
}

export interface SanctionStats {
  totalCount: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  byRegion: Array<{ regionCode: string; regionName: string; count: number }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert YYYYMMDD string to ISO date string, or null if invalid. */
export function parseKoreanDate(raw: string): string | null {
  if (!raw || raw.length !== 8) return null
  const y = raw.slice(0, 4)
  const m = raw.slice(4, 6)
  const d = raw.slice(6, 8)
  const iso = `${y}-${m}-${d}`
  const ts = Date.parse(iso)
  return isNaN(ts) ? null : iso
}

/** Derive severity from disposition content text. */
export function deriveSeverity(dspnCn: string): string {
  if (dspnCn.includes('취소') || dspnCn.includes('폐쇄')) return 'critical'
  if (dspnCn.includes('영업정지')) {
    const match = dspnCn.match(/(\d+)일/)
    if (match) {
      const days = parseInt(match[1], 10)
      if (days >= 30) return 'high'
      if (days >= 7) return 'medium'
    }
    return 'medium'
  }
  if (dspnCn.includes('시정명령') || dspnCn.includes('과태료') || dspnCn.includes('경고')) return 'low'
  return 'low'
}

/** Derive a stable id from row fields (no UUID from API). */
export function deriveRowId(row: I2715Row, index: number): string {
  const base = `${row.LCNS_NO || ''}-${row.DSPN_DT || ''}-${index}`
  // btoa works in both Edge runtime and Node; replace chars that are not URL-safe
  return btoa(encodeURIComponent(base)).replace(/[+/=]/g, '').slice(0, 24)
}

/** Map a raw I2715Row to our RestaurantItem shape. */
export function mapRowToRestaurant(row: I2715Row, index: number): RestaurantItem {
  const id = deriveRowId(row, index)
  return {
    id,
    name: row.BSSH_NM ?? '',
    normalizedName: (row.BSSH_NM ?? '').replace(/\s+/g, '').toLowerCase(),
    category: row.INDUTYPE_NM ?? '',
    roadAddress: row.ADDR || null,
    jibunAddress: null,
    latitude: null,
    longitude: null,
    regionCode: row.AREA_NM ?? '',
    status: 'active',
    totalSanctions: 1,
    lastSanctionAt: parseKoreanDate(row.DSPN_DT),
  }
}

/** Map a raw I2715Row to our SanctionItem shape. */
export function mapRowToSanction(row: I2715Row, index: number): SanctionItem {
  const id = deriveRowId(row, index)
  return {
    id,
    sanctionType: row.DSPN_CN ?? '',
    severity: deriveSeverity(row.DSPN_CN ?? ''),
    violationContent: row.VIOL_CN ?? '',
    dispositionContent: row.DSPN_CN ?? '',
    dispositionDate: parseKoreanDate(row.DSPN_DT) ?? row.DSPN_DT ?? '',
    restaurant: {
      id,
      name: row.BSSH_NM ?? '',
      category: row.INDUTYPE_NM ?? '',
    },
  }
}

// ─── API caller ───────────────────────────────────────────────────────────────

const BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api'

export interface FetchI2715Options {
  apiKey: string
  start?: number
  end?: number
  /** Additional query params appended to the URL (e.g. BSSH_NM=치킨) */
  extraParams?: Record<string, string>
}

export interface FetchI2715Result {
  rows: I2715Row[]
  totalCount: number
  resultCode: string
  resultMessage: string
}

export async function fetchI2715(opts: FetchI2715Options): Promise<FetchI2715Result> {
  const { apiKey, start = 1, end = 20, extraParams = {} } = opts

  const url = new URL(`${BASE_URL}/${apiKey}/I2715/json/${start}/${end}`)
  for (const [k, v] of Object.entries(extraParams)) {
    if (v) url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new PublicApiError(
      `upstream_http_${res.status}`,
      `data.go.kr returned HTTP ${res.status}`,
    )
  }

  const data = (await res.json()) as I2715Response

  const inner = data?.I2715
  if (!inner) {
    throw new PublicApiError('malformed_response', 'Unexpected API response shape')
  }

  const code = inner.RESULT?.CODE ?? ''
  if (code !== 'INFO-000' && code !== 'INFO-200') {
    throw new PublicApiError(code, inner.RESULT?.MESSAGE ?? 'API error')
  }

  return {
    rows: inner.row ?? [],
    totalCount: parseInt(inner.total_count ?? '0', 10),
    resultCode: code,
    resultMessage: inner.RESULT?.MESSAGE ?? '',
  }
}

// ─── Error type ───────────────────────────────────────────────────────────────

export class PublicApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'PublicApiError'
  }
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' ? '*' : '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const cacheHeaders: Record<string, string> = {
  'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
}
