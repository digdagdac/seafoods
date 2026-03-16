import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, markAlertAsRead } from '@/lib/api'

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  })
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAlertAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
