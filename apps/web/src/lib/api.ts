const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

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
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.limit) params.set('limit', String(query.limit))

  return apiFetch<{ items: SanctionItem[] }>(`/sanctions/recent?${params.toString()}`)
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

export async function getRegionSummary(): Promise<RegionSummary[]> {
  const stats = await getSanctionStats()
  return stats.byRegion.map((r) => ({
    regionCode: r.regionCode,
    regionName: r.regionName,
    totalSanctions: r.count,
    criticalCount: 0,
    highCount: 0,
    lastUpdatedAt: new Date().toISOString(),
  }))
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

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

export async function getAlerts() {
  return apiFetch<{ items: AlertDto[]; cursor: string | null; hasMore: boolean }>('/alerts')
}

export async function markAlertAsRead(alertId: string) {
  return apiFetch<{ id: string; isRead: boolean; readAt: string }>(`/alerts/${alertId}/read`, {
    method: 'PATCH',
  })
}

export async function markAllAlertsAsRead() {
  return apiFetch<{ updated: number }>('/alerts/read-all', {
    method: 'PATCH',
  })
}

export async function getUnreadAlertCount() {
  return apiFetch<{ unreadCount: number }>('/alerts/unread-count')
}

// ─── Bookmarks ──────────────────────────────────────────────────────────────

export async function getBookmarks() {
  return apiFetch<{ items: Array<{ id: string; createdAt: string; restaurant: RestaurantItem }> }>('/bookmarks')
}

export async function addBookmark(restaurantId: string) {
  return apiFetch(`/bookmarks/${restaurantId}`, { method: 'POST' })
}

export async function removeBookmark(restaurantId: string) {
  return apiFetch(`/bookmarks/${restaurantId}`, { method: 'DELETE' })
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface UserDto {
  id: string
  email: string
  name: string | null
  provider: string | null
  notificationEnabled: boolean
}

export async function login(email: string, password: string) {
  return apiFetch<{ user: UserDto; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function signup(email: string, password: string, name?: string) {
  return apiFetch<{ user: UserDto; tokens: { accessToken: string; refreshToken: string } }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
}

export async function getMe() {
  return apiFetch<UserDto>('/auth/me')
}
