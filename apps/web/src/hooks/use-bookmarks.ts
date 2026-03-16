import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBookmarks, addBookmark, removeBookmark } from '@/lib/api'

export function useBookmarks() {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: getBookmarks,
  })
}

export function useAddBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}
