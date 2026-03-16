// 검색 요청 DTO
export interface SearchRequestDto {
  q: string;
  region?: string;
  category?: string;
  sanctionType?: string;
  dateFrom?: string;
  dateTo?: string;
  hasSanction?: boolean;
  cursor?: string;
  limit?: number;
  sortBy?: 'relevance' | 'date_desc' | 'date_asc' | 'severity';
}

// 주변 검색 요청 DTO
export interface NearbyRequestDto {
  lat: number;
  lng: number;
  radius?: number; // meters, default 1000
  hasSanction?: boolean;
  cursor?: string;
  limit?: number;
}

// 회원가입 요청 DTO
export interface SignupRequestDto {
  email: string;
  password: string;
  name?: string;
}

// 로그인 요청 DTO
export interface LoginRequestDto {
  email: string;
  password: string;
}

// 알림 구독 요청 DTO
export interface SubscribeRequestDto {
  regions?: string[];
  categories?: string[];
  restaurantIds?: string[];
}

// 페이지네이션 응답 메타
export interface PaginationMeta {
  cursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

// 통계 응답 DTO
export interface SanctionStatsDto {
  totalCount: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byMonth: Array<{
    month: string;
    count: number;
  }>;
  byRegion: Array<{
    regionCode: string;
    regionName: string;
    count: number;
  }>;
}
