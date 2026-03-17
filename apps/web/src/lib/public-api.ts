/**
 * 식품안전나라 Open API - I2630 행정처분결과(식품접객업)
 * https://www.foodsafetykorea.go.kr/api/openApiInfo.do?svc_no=I2630
 * URL: http://openapi.foodsafetykorea.go.kr/api/{keyId}/I2630/{dataType}/{startIdx}/{endIdx}
 */

// ─── Raw API types (I2630 필드) ──────────────────────────────────────────────

export interface I2630Row {
  PRCSCITYPOINT_BSSHNM: string  // 업소명
  INDUTY_CD_NM: string          // 업종
  LCNS_NO: string               // 인허가번호
  DSPS_DCSNDT: string           // 처분확정일자
  DSPS_BGNDT: string            // 처분시작일
  DSPS_ENDDT: string            // 처분종료일
  DSPS_TYPECD_NM: string        // 처분유형
  VILTCN: string                // 위반일자및위반내용
  ADDR: string                  // 주소
  TEL_NO: string                // 전화번호
  PRSDNT_NM: string             // 대표자명
  DSPSCN: string                // 처분내용
  LAWORD_CD_NM: string          // 위반법령
  PUBLIC_DT: string             // 공개기한
  LAST_UPDT_DTM: string         // 최종수정일
  DSPS_INSTTCD_NM: string       // 처분기관명
  DSPSDTLS_SEQ: string          // 행정처분전산키
}

export interface I2630Result {
  CODE: string
  MESSAGE: string
}

export interface I2630Response {
  I2630: {
    total_count: string
    row?: I2630Row[]
    RESULT: I2630Result
  }
}

// ─── Mapped types ─────────────────────────────────────────────────────────────

export interface RestaurantItem {
  id: string
  name: string
  normalizedName: string
  category: string
  roadAddress: string | null
  regionName: string
  status: string
  totalSanctions: number
  lastSanctionAt: string | null
  phone: string | null
  representative: string | null
}

export interface SanctionItem {
  id: string
  sanctionType: string
  severity: string
  violationContent: string
  dispositionContent: string
  dispositionDate: string
  dispositionStartDate: string | null
  dispositionEndDate: string | null
  violatedLaw: string | null
  dispositionAgency: string | null
  restaurant: { id: string; name: string; category: string }
}

export interface SanctionStats {
  totalCount: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  byRegion: Array<{ regionCode: string; regionName: string; count: number }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert YYYYMMDD or YYYY-MM-DD string to ISO date string. */
export function parseDate(raw: string): string | null {
  if (!raw) return null
  const cleaned = raw.replace(/-/g, '').trim()
  if (cleaned.length < 8) return null
  const y = cleaned.slice(0, 4)
  const m = cleaned.slice(4, 6)
  const d = cleaned.slice(6, 8)
  const iso = `${y}-${m}-${d}`
  return isNaN(Date.parse(iso)) ? null : iso
}

/** 처분유형에서 severity 추출 */
export function deriveSeverity(typeNm: string, content: string): string {
  const combined = `${typeNm} ${content}`
  if (combined.includes('허가취소') || combined.includes('폐쇄명령') || combined.includes('영업허가취소')) return 'CRITICAL'
  if (combined.includes('영업정지')) {
    const match = combined.match(/(\d+)개?월/)
    if (match && parseInt(match[1], 10) >= 2) return 'HIGH'
    const dayMatch = combined.match(/(\d+)일/)
    if (dayMatch && parseInt(dayMatch[1], 10) >= 30) return 'HIGH'
    return 'MEDIUM'
  }
  if (combined.includes('과징금') || combined.includes('과태료')) return 'MEDIUM'
  if (combined.includes('시정명령') || combined.includes('경고') || combined.includes('개선명령')) return 'LOW'
  return 'LOW'
}

/** 처분유형 코드 매핑 */
export function deriveSanctionType(typeNm: string): string {
  if (typeNm.includes('영업정지')) return 'LICENSE_SUSPENSION'
  if (typeNm.includes('허가취소') || typeNm.includes('영업허가취소')) return 'LICENSE_REVOCATION'
  if (typeNm.includes('폐쇄명령') || typeNm.includes('폐쇄')) return 'CLOSURE_ORDER'
  if (typeNm.includes('과징금') || typeNm.includes('과태료')) return 'FINE'
  if (typeNm.includes('시정명령') || typeNm.includes('개선명령')) return 'IMPROVEMENT_ORDER'
  if (typeNm.includes('경고')) return 'WARNING'
  return 'OTHER'
}

/** Derive a stable id from the 행정처분전산키 or fallback. */
export function deriveRowId(row: I2630Row, index: number): string {
  if (row.DSPSDTLS_SEQ) return row.DSPSDTLS_SEQ
  const base = `${row.LCNS_NO || ''}-${row.DSPS_DCSNDT || ''}-${index}`
  return btoa(encodeURIComponent(base)).replace(/[+/=]/g, '').slice(0, 24)
}

/** 주소에서 지역명 추출 */
function extractRegion(addr: string): string {
  if (!addr) return ''
  const match = addr.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/)
  return match ? match[1] : ''
}

/** Map a raw I2630Row to RestaurantItem */
export function mapRowToRestaurant(row: I2630Row, index: number): RestaurantItem {
  return {
    id: deriveRowId(row, index),
    name: row.PRCSCITYPOINT_BSSHNM ?? '',
    normalizedName: (row.PRCSCITYPOINT_BSSHNM ?? '').replace(/\s+/g, '').toLowerCase(),
    category: row.INDUTY_CD_NM ?? '',
    roadAddress: row.ADDR || null,
    regionName: extractRegion(row.ADDR),
    status: 'ACTIVE',
    totalSanctions: 1,
    lastSanctionAt: parseDate(row.DSPS_DCSNDT),
    phone: row.TEL_NO || null,
    representative: row.PRSDNT_NM || null,
  }
}

/** Map a raw I2630Row to SanctionItem */
export function mapRowToSanction(row: I2630Row, index: number): SanctionItem {
  const id = deriveRowId(row, index)
  const typeNm = row.DSPS_TYPECD_NM ?? ''
  const content = row.DSPSCN ?? ''
  return {
    id,
    sanctionType: deriveSanctionType(typeNm),
    severity: deriveSeverity(typeNm, content),
    violationContent: row.VILTCN ?? '',
    dispositionContent: content,
    dispositionDate: parseDate(row.DSPS_DCSNDT) ?? '',
    dispositionStartDate: parseDate(row.DSPS_BGNDT),
    dispositionEndDate: parseDate(row.DSPS_ENDDT),
    violatedLaw: row.LAWORD_CD_NM || null,
    dispositionAgency: row.DSPS_INSTTCD_NM || null,
    restaurant: {
      id,
      name: row.PRCSCITYPOINT_BSSHNM ?? '',
      category: row.INDUTY_CD_NM ?? '',
    },
  }
}

// ─── API caller ──────────────────────────────────────────────────────────────

const BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api'
const SERVICE_ID = 'I2630'

export interface FetchOptions {
  apiKey: string
  start?: number
  end?: number
  /** 추가 쿼리 파라미터 (e.g. PRCSCITYPOINT_BSSHNM=치킨) */
  params?: Record<string, string>
}

export interface FetchResult {
  rows: I2630Row[]
  totalCount: number
  resultCode: string
  resultMessage: string
}

export async function fetchSanctions(opts: FetchOptions): Promise<FetchResult> {
  const { apiKey, start = 1, end = 20, params = {} } = opts

  // URL format: /api/{keyId}/{serviceId}/{dataType}/{startIdx}/{endIdx}
  let url = `${BASE_URL}/${apiKey}/${SERVICE_ID}/json/${start}/${end}`

  // 추가 파라미터는 URL 경로 뒤에 붙임
  const paramStr = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  if (paramStr) url += `?${paramStr}`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new PublicApiError(
      `upstream_http_${res.status}`,
      `식품안전나라 API HTTP ${res.status}`,
    )
  }

  const data = (await res.json()) as I2630Response

  const inner = data?.I2630
  if (!inner) {
    throw new PublicApiError('malformed_response', 'API 응답 형식 오류')
  }

  const code = inner.RESULT?.CODE ?? ''
  if (code !== 'INFO-000' && code !== 'INFO-200') {
    throw new PublicApiError(code, inner.RESULT?.MESSAGE ?? 'API 오류')
  }

  return {
    rows: inner.row ?? [],
    totalCount: parseInt(inner.total_count ?? '0', 10),
    resultCode: code,
    resultMessage: inner.RESULT?.MESSAGE ?? '',
  }
}

// ─── Error type ──────────────────────────────────────────────────────────────

export class PublicApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'PublicApiError'
  }
}

// ─── CORS / Cache headers ────────────────────────────────────────────────────

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const cacheHeaders: Record<string, string> = {
  'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
}
