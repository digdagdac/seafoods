'use client'

import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollProps {
  hasMore: boolean
  isLoading: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  endComponent?: React.ReactNode
}

export function InfiniteScroll({
  hasMore,
  isLoading,
  isFetchingNextPage,
  fetchNextPage,
  children,
  loadingComponent,
  endComponent,
}: InfiniteScrollProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
  })

  useEffect(() => {
    if (inView && hasMore && !isFetchingNextPage && !isLoading) {
      fetchNextPage()
    }
  }, [inView, hasMore, isFetchingNextPage, isLoading, fetchNextPage])

  return (
    <div className="w-full">
      {children}
      
      <div ref={ref} className="py-8 flex justify-center w-full">
        {isFetchingNextPage || isLoading ? (
          loadingComponent || (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-navy" />
              <p className="text-xs text-gray-500 font-medium">데이터를 불러오는 중...</p>
            </div>
          )
        ) : (
          !hasMore && children && (
            endComponent || (
              <p className="text-xs text-gray-400 font-medium italic">
                모든 데이터를 확인했습니다
              </p>
            )
          )
        )}
      </div>
    </div>
  )
}
