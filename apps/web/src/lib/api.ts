import type {
  ApiResponse,
  ApiErrorResponse,
  RestaurantDto,
  SanctionDto,
  SearchQuery,
  NearbyQuery,
} from '@safedeliver/shared-types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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

  const json = (await res.json()) as ApiResponse<T> | ApiErrorResponse

  if (!json.success) {
    const err = json as ApiErrorResponse
    throw new ApiError(err.error.code, err.error.message, err.error.details)
  }

  return (json as ApiResponse<T>).data
}

// ─── Restaurant ──────────────────────────────────────────────────────────────

export async function searchRestaurants(
  query: SearchQuery,
): Promise<{ restaurants: RestaurantDto[]; cursor?: string; hasMore: boolean }> {
  const params = new URLSearchParams()
  params.set('q', query.q)
  if (query.region) params.set('region', query.region)
  if (query.category) params.set('category', query.category)
  if (query.hasSanction !== undefined) params.set('hasSanction', String(query.hasSanction))
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.limit) params.set('limit', String(query.limit))

  return apiFetch(`/v1/restaurants/search?${params.toString()}`)
}

export async function getNearbyRestaurants(
  query: NearbyQuery,
): Promise<{ restaurants: RestaurantDto[]; cursor?: string; hasMore: boolean }> {
  const params = new URLSearchParams()
  params.set('lat', String(query.lat))
  params.set('lng', String(query.lng))
  if (query.radius) params.set('radius', String(query.radius))
  if (query.hasSanction !== undefined) params.set('hasSanction', String(query.hasSanction))
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.limit) params.set('limit', String(query.limit))

  return apiFetch(`/v1/restaurants/nearby?${params.toString()}`)
}

export async function getRestaurant(id: string): Promise<RestaurantDto> {
  return apiFetch(`/v1/restaurants/${id}`)
}

// ─── Sanctions ───────────────────────────────────────────────────────────────

export async function getRestaurantSanctions(restaurantId: string): Promise<SanctionDto[]> {
  return apiFetch(`/v1/restaurants/${restaurantId}/sanctions`)
}

export async function getRecentSanctions(limit = 10): Promise<SanctionDto[]> {
  return apiFetch(`/v1/sanctions/recent?limit=${limit}`)
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

export async function getRegionSummary(regionCode: string): Promise<RegionSummary> {
  return apiFetch(`/v1/regions/${regionCode}/summary`)
}
