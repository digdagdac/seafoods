// 행정처분 유형
export enum SanctionType {
  LICENSE_SUSPENSION = 'LICENSE_SUSPENSION',     // 영업정지
  LICENSE_REVOCATION = 'LICENSE_REVOCATION',     // 영업취소
  IMPROVEMENT_ORDER = 'IMPROVEMENT_ORDER',       // 시정명령
  FINE = 'FINE',                                 // 과징금/과태료
  WARNING = 'WARNING',                           // 경고
  CLOSURE_ORDER = 'CLOSURE_ORDER',               // 폐쇄명령
  OTHER = 'OTHER',                               // 기타
}

// 행정처분 심각도
export enum SanctionSeverity {
  CRITICAL = 'CRITICAL',   // 영업취소, 폐쇄명령
  HIGH = 'HIGH',           // 영업정지 2개월 이상
  MEDIUM = 'MEDIUM',       // 영업정지 1개월 미만, 과징금
  LOW = 'LOW',             // 시정명령, 경고
}

// 음식점 상태
export enum RestaurantStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
  UNKNOWN = 'UNKNOWN',
}

// 알림 구독 유형
export enum SubscriptionType {
  REGION = 'REGION',
  CATEGORY = 'CATEGORY',
  RESTAURANT = 'RESTAURANT',
}

// 알림 유형
export enum AlertType {
  BOOKMARK_SANCTION = 'BOOKMARK_SANCTION',
  REGION_SANCTION = 'REGION_SANCTION',
  CATEGORY_SANCTION = 'CATEGORY_SANCTION',
}

// 인증 프로바이더
export enum AuthProvider {
  KAKAO = 'KAKAO',
  NAVER = 'NAVER',
  GOOGLE = 'GOOGLE',
}

// API 응답 타입
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    cursor?: string;
    hasMore?: boolean;
    totalCount?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 음식점 DTO
export interface RestaurantDto {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  roadAddress: string | null;
  jibunAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  regionCode: string;
  status: RestaurantStatus;
  totalSanctions: number;
  lastSanctionAt: string | null;
}

// 행정처분 DTO
export interface SanctionDto {
  id: string;
  restaurantId: string;
  sanctionType: SanctionType;
  severity: SanctionSeverity;
  violationContent: string;
  dispositionContent: string;
  dispositionDate: string;
  legalBasis: string | null;
  source: string;
  isVerified: boolean;
}

// 검색 요청
export interface SearchQuery {
  q: string;
  region?: string;
  category?: string;
  hasSanction?: boolean;
  cursor?: string;
  limit?: number;
}

// 주변 검색 요청
export interface NearbyQuery {
  lat: number;
  lng: number;
  radius?: number;
  hasSanction?: boolean;
  cursor?: string;
  limit?: number;
}
