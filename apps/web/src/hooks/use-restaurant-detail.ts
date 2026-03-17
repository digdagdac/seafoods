import { useQuery } from '@tanstack/react-query'
import { getRestaurantDetail } from '@/lib/api'
import type { RestaurantDetailItem, RestaurantDetailSanctionItem } from '@/lib/api'

export type { RestaurantDetailItem, RestaurantDetailSanctionItem }

export function useRestaurantDetail(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurant-detail', id],
    queryFn: () => getRestaurantDetail(id),
    enabled: !!id,
  })

  return {
    restaurant: data?.restaurant ?? null,
    sanctions: data?.sanctions ?? [],
    isLoading,
    error,
  }
}
