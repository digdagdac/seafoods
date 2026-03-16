import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getRecentSanctions, getRestaurantSanctions } from '@/lib/api'

export function useRecentSanctions(limit = 10) {
  return useInfiniteQuery({
    queryKey: ['sanctions', 'recent'],
    queryFn: ({ pageParam }) => getRecentSanctions({ cursor: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor : undefined),
  })
}

export function useRestaurantSanctions(restaurantId: string) {
  return useQuery({
    queryKey: ['sanctions', 'restaurant', restaurantId],
    queryFn: () => getRestaurantSanctions(restaurantId),
    enabled: !!restaurantId,
  })
}
