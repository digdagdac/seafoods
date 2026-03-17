import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { searchRestaurants, getRestaurant, getNearbyRestaurants } from '@/lib/api'
import type { NearbyQuery } from '@safedeliver/shared-types'

export interface SearchRestaurantsQuery {
  q?: string
  region?: string
  category?: string
  hasSanction?: boolean
  sort?: 'recent' | 'severity' | 'count'
  limit?: number
}

export function useSearchRestaurants(query: SearchRestaurantsQuery) {
  return useInfiniteQuery({
    queryKey: ['restaurants', 'search', query],
    queryFn: ({ pageParam }) => searchRestaurants({ ...query, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor : undefined),
    enabled: true,
  })
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => getRestaurant(id),
    enabled: !!id,
  })
}

export function useNearbyRestaurants(query: NearbyQuery) {
  return useInfiniteQuery({
    queryKey: ['restaurants', 'nearby', query],
    queryFn: ({ pageParam }) => getNearbyRestaurants({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor : undefined),
  })
}
