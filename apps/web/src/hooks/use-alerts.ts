import { useQuery } from '@tanstack/react-query'
import { getRecentSanctions } from '@/lib/api'

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts', 'sanctions'],
    queryFn: () => getRecentSanctions({ limit: 30 }),
  })
}

// No-op kept for backward compatibility
export function useMarkAlertAsRead() {
  return { mutate: (_id: string) => {} }
}
