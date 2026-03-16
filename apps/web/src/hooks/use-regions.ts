import { useQuery } from '@tanstack/react-query'
import { getRegionSummary } from '@/lib/api'

export function useRegionSummary(regionCode: string) {
  return useQuery({
    queryKey: ['region-summary', regionCode],
    queryFn: () => getRegionSummary(regionCode),
    enabled: !!regionCode,
  })
}
