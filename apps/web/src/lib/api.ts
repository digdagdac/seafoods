const API_BASE_URL = '/api'

class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      body.error ?? String(res.status),
      body.message ?? res.statusText,
      body,
    )
  }

  return res.json() as Promise<T>
}

// ─── Restaurant ──────────────────────────────────────────────────────────────

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

export async function searchRestaurants(
  query: { q: string; region?: string; category?: string; hasSanction?: boolean; cursor?: string; limit?: number },
) {
  const params = new URLSearchParams()
  params.set('q', query.q)
  if (query.region) params.set('region', query.region)
  if (query.category) params.set('category', query.category)
  if (query.hasSanction !== undefined) params.set('hasSanction', String(query.hasSanction))
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.limit) params.set('limit', String(query.limit))

  return apiFetch<{ items: RestaurantItem[]; cursor?: string; hasMore: boolean }>(`/search?${params.toString()}`)
}

export async function getNearbyRestaurants(
  query: { lat: number; lng: number; radius?: number; hasSanction?: boolean; cursor?: string; limit?: number },
) {
  const params = new URLSearchParams()
  params.set('lat', String(query.lat))
  params.set('lng', String(query.lng))
  if (query.radius) params.set('radius', String(query.radius))
  if (query.hasSanction !== undefined) params.set('hasSanction', String(query.hasSanction))
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.limit) params.set('limit', String(query.limit))

  return apiFetch<{ items: RestaurantItem[]; hasMore: boolean }>(`/restaurants/nearby?${params.toString()}`)
}

export async function getRestaurant(id: string) {
  return apiFetch<RestaurantItem>(`/restaurants/${id}`)
}

export async function getRestaurants() {
  return apiFetch<{ items: RestaurantItem[]; hasMore: boolean }>('/restaurants')
}

// ─── Sanctions ───────────────────────────────────────────────────────────────

export interface SanctionItem {
  id: string
  sanctionType: string
  severity: string
  violationContent: string
  dispositionContent: string
  dispositionDate: string
  restaurant: { id: string; name: string; category: string }
}

export async function getRestaurantSanctions(restaurantId: string) {
  return apiFetch<{ items: SanctionItem[] }>(`/sanctions?restaurantId=${restaurantId}`)
}

export async function getRecentSanctions(query: { cursor?: string; limit?: number } = {}) {
  const params = new URLSearchParams()
  params.set('sort', 'recent')
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.limit) params.set('limit', String(query.limit))

  return apiFetch<{ items: SanctionItem[]; cursor?: string; hasMore: boolean }>(`/sanctions?${params.toString()}`)
}

export async function getSanctionStats() {
  return apiFetch<{
    totalCount: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    byMonth: Array<{ month: string; count: number }>
    byRegion: Array<{ regionCode: string; regionName: string; count: number }>
  }>('/sanctions/stats')
}

// ─── Region summary ──────────────────────────────────────────────────────────

export interface RegionSummary {
  regionCode: string
  regionName: string
  totalSanctions: number
  criticalCount: number
  highCount: number
  lastUpdatedAt: string
}

export async function getRegionSummary(regionCode?: string): Promise<RegionSummary | null> {
  const stats = await getSanctionStats()
  const regions = stats.byRegion.map((r) => ({
    regionCode: r.regionCode,
    regionName: r.regionName,
    totalSanctions: r.count,
    criticalCount: 0,
    highCount: 0,
    lastUpdatedAt: new Date().toISOString(),
  }))
  if (regionCode) {
    return regions.find((r) => r.regionCode === regionCode) ?? regions[0] ?? null
  }
  return regions[0] ?? null
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
// TODO: needs backend for user-specific data

export interface AlertDto {
  id: string
  alertType: string
  title: string
  body: string
  isRead: boolean
  sentAt: string
  readAt: string | null
  sanction?: {
    id: string
    sanctionType: string
    severity: string
    dispositionDate: string
    restaurant: { id: string; name: string; category: string }
  }
}

export async function getAlerts(): Promise<{ items: AlertDto[]; cursor: string | null; hasMore: boolean }> {
  // TODO: needs backend for user-specific data
  return { items: [], cursor: null, hasMore: false }
}

export async function markAlertAsRead(_alertId: string): Promise<{ id: string; isRead: boolean; readAt: string }> {
  // TODO: needs backend for user-specific data
  throw new ApiError('NOT_IMPLEMENTED', '알림 기능은 아직 준비 중입니다.')
}

export async function markAllAlertsAsRead(): Promise<{ updated: number }> {
  // TODO: needs backend for user-specific data
  return { updated: 0 }
}

export async function getUnreadAlertCount(): Promise<{ unreadCount: number }> {
  // TODO: needs backend for user-specific data
  return { unreadCount: 0 }
}

// ─── Bookmarks ──────────────────────────────────────────────────────────────
// TODO: needs backend for user-specific data

export async function getBookmarks(): Promise<{ items: Array<{ id: string; createdAt: string; restaurant: RestaurantItem }> }> {
  // TODO: needs backend for user-specific data
  return { items: [] }
}

export async function addBookmark(_restaurantId: string): Promise<void> {
  // TODO: needs backend for user-specific data
  throw new ApiError('NOT_IMPLEMENTED', '북마크 기능은 아직 준비 중입니다.')
}

export async function removeBookmark(_restaurantId: string): Promise<void> {
  // TODO: needs backend for user-specific data
  throw new ApiError('NOT_IMPLEMENTED', '북마크 기능은 아직 준비 중입니다.')
}

// ─── Auth ───────────────────────────────────────────────────────────────────
// TODO: needs backend for user-specific data

export interface UserDto {
  id: string
  email: string
  name: string | null
  provider: string | null
  notificationEnabled: boolean
}

export async function login(_email: string, _password: string): Promise<{ user: UserDto; tokens: { accessToken: string; refreshToken: string } }> {
  // TODO: needs backend for user-specific data
  throw new ApiError('NOT_IMPLEMENTED', '로그인 기능은 아직 준비 중입니다.')
}

export async function signup(_email: string, _password: string, _name?: string): Promise<{ user: UserDto; tokens: { accessToken: string; refreshToken: string } }> {
  // TODO: needs backend for user-specific data
  throw new ApiError('NOT_IMPLEMENTED', '회원가입 기능은 아직 준비 중입니다.')
}

export async function getMe(): Promise<UserDto> {
  // TODO: needs backend for user-specific data
  throw new ApiError('NOT_IMPLEMENTED', '로그인이 필요합니다.')
}
