/**
 * 음식점명 정규화 유틸리티
 * 법인명 제거, 지점명 분리, 특수문자 제거
 */

const LEGAL_ENTITY_PATTERNS = [
  /^(주식회사|유한회사|합자회사|합명회사|사단법인|재단법인)\s*/,
  /\s*(\(주\)|\(유\)|\(합\))/,
  /\s*(주식회사|유한회사)$/,
];

const BRANCH_PATTERNS = [
  /\s*(본점|지점|분점|[가-힣]+점|[가-힣]+동점|[0-9]+호점)$/,
  /\s*(강남|서초|송파|마포|종로|홍대|신촌|이태원|역삼)\s*점$/,
];

export interface NormalizedName {
  normalized: string;
  legalEntity: string | null;
  branch: string | null;
}

export function normalizeRestaurantName(raw: string): NormalizedName {
  let name = raw.trim();
  let legalEntity: string | null = null;
  let branch: string | null = null;

  for (const pattern of LEGAL_ENTITY_PATTERNS) {
    const match = name.match(pattern);
    if (match) {
      legalEntity = match[1] || match[0];
      name = name.replace(pattern, '');
    }
  }

  for (const pattern of BRANCH_PATTERNS) {
    const match = name.match(pattern);
    if (match) {
      branch = match[1];
      name = name.replace(pattern, '');
    }
  }

  name = name.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

  return { normalized: name, legalEntity, branch };
}

/**
 * 주소 정규화
 */
export function normalizeAddress(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/특별시/g, '')
    .replace(/광역시/g, '')
    .replace(/특별자치시/g, '')
    .replace(/특별자치도/g, '')
    .trim();
}

/**
 * 심각도 레벨 계산
 */
export function calculateSeverityLevel(
  sanctionType: string,
  details?: string,
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (
    sanctionType === 'LICENSE_REVOCATION' ||
    sanctionType === 'CLOSURE_ORDER'
  ) {
    return 'CRITICAL';
  }
  if (sanctionType === 'LICENSE_SUSPENSION') {
    if (details && /[2-9]개월|[1-9][0-9]+일/.test(details)) {
      return 'HIGH';
    }
    return 'MEDIUM';
  }
  if (sanctionType === 'FINE') {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * 날짜 포맷
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 거리 포맷 (미터 → 읽기 쉬운 형태)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
