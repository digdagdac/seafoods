import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { searchRestaurants, getRestaurant, getNearbyRestaurants } from '@/lib/api'
import type { SearchQuery, NearbyQuery } from '@safedeliver/shared-types'

export function useSearchRestaurants(query: SearchQuery) {
  return useInfiniteQuery({
    queryKey: ['restaurants', 'search', query],
    queryFn: ({ pageParam }) => searchRestaurants({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor : undefined),
    enabled: !!query.q,
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
