'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense, useEffect } from 'react'
import { SlidersHorizontal, X, MapPin, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/ui/search-bar'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import { useSearchRestaurants } from '@/hooks/use-restaurants'
import { cn } from '@/lib/utils'
import { SanctionSeverity, RestaurantStatus, RestaurantDto } from '@safedeliver/shared-types'

// ─── Filter definitions ───────────────────────────────────────────────────────

interface FilterOption {
  id: string
  label: string
  type: 'severity' | 'category' | 'status'
  value: string
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'cat:chicken', label: '치킨', type: 'category', value: '치킨' },
  { id: 'cat:chinese', label: '중식', type: 'category', value: '중식' },
  { id: 'cat:korean', label: '한식', type: 'category', value: '한식' },
  { id: 'cat:japanese', label: '일식', type: 'category', value: '일식' },
  { id: 'cat:pizza', label: '피자', type: 'category', value: '피자' },
  { id: 'cat:burger', label: '패스트푸드', type: 'category', value: '패스트푸드' },
]

const STATUS_LABEL: Record<RestaurantStatus, string> = {
  [RestaurantStatus.ACTIVE]: '영업 중',
  [RestaurantStatus.SUSPENDED]: '영업정지',
  [RestaurantStatus.CLOSED]: '폐업',
  [RestaurantStatus.UNKNOWN]: '알 수 없음',
}

const STATUS_COLOR: Record<RestaurantStatus, string> = {
  [RestaurantStatus.ACTIVE]: 'text-emerald-600 bg-emerald-50',
  [RestaurantStatus.SUSPENDED]: 'text-orange-700 bg-orange-50',
  [RestaurantStatus.CLOSED]: 'text-gray-500 bg-gray-100',
  [RestaurantStatus.UNKNOWN]: 'text-gray-400 bg-gray-50',
}

// ─── Main component ───────────────────────────────────────────────────────────

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryTerm = searchParams.get('q') ?? ''
  
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    searchParams.get('category') ?? undefined
  )
  const [hasSanctionOnly, setHasSanctionOnly] = useState<boolean>(
    searchParams.get('hasSanction') === 'true'
  )
  const [sortBy, setSortBy] = useState<'recent' | 'severity' | 'count'>('recent')

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch
  } = useSearchRestaurants({
    q: queryTerm,
    category: selectedCategory,
    hasSanction: hasSanctionOnly || undefined,
    limit: 10,
  })

  useEffect(() => {
    // Update URL when filters change (optional, but good for UX)
    const params = new URLSearchParams(searchParams.toString())
    if (selectedCategory) params.set('category', selectedCategory)
    else params.delete('category')
    
    if (hasSanctionOnly) params.set('hasSanction', 'true')
    else params.delete('hasSanction')
    
    // router.replace(`/search?${params.toString()}`, { scroll: false })
  }, [selectedCategory, hasSanctionOnly])

  const restaurants = data?.pages.flatMap((page) => (page as any).restaurants as RestaurantDto[]) ?? []
  const totalCount = (data?.pages[0] as any)?.totalCount ?? restaurants.length

  function toggleCategory(cat: string) {
    setSelectedCategory(prev => prev === cat ? undefined : cat)
  }

  return (
    <>
      <Header showBack title="검색 결과" />

      {/* Search bar */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <SearchBar defaultValue={queryTerm} size="md" />
      </div>

      {/* Filter chips — horizontally scrollable */}
      <div className="sticky top-[calc(3.5rem+3.5rem)] z-20 bg-white border-b border-gray-100">
        <div
          className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none"
          role="group"
          aria-label="검색 필터"
        >
          <button
            type="button"
            onClick={() => setHasSanctionOnly(!hasSanctionOnly)}
            aria-pressed={hasSanctionOnly}
            className={cn(
              'flex-shrink-0 chip flex items-center gap-1.5',
              hasSanctionOnly ? 'chip-active' : 'chip-inactive'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            처분 이력만
          </button>

          <div className="w-px h-4 bg-gray-200 mx-1 flex-shrink-0" />

          {FILTER_OPTIONS.map((opt) => {
            const active = selectedCategory === opt.value
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleCategory(opt.value)}
                aria-pressed={active}
                className={cn('flex-shrink-0 chip', active ? 'chip-active' : 'chip-inactive')}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-1 px-4 pb-2.5" role="group" aria-label="정렬 기준">
          <span className="text-xs text-gray-400 mr-1">정렬:</span>
          {[
            { id: 'recent', label: '최신순' },
            { id: 'severity', label: '심각도순' },
            { id: 'count', label: '처분건수순' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSortBy(opt.id as typeof sortBy)}
              aria-pressed={sortBy === opt.id}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full font-medium transition-colors duration-150',
                sortBy === opt.id
                  ? 'bg-navy text-white'
                  : 'text-gray-500 hover:text-navy',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pt-4 pb-20">
        {/* Result count */}
        <p className="text-xs text-gray-400 mb-3" aria-live="polite">
          {queryTerm ? (
            <>
              <span className="font-semibold text-navy">"{queryTerm}"</span> 검색 결과{' '}
              <span className="font-semibold text-navy">{totalCount}건</span>
            </>
          ) : (
            `전체 ${totalCount}건`
          )}
        </p>

        <InfiniteScroll
          hasMore={!!hasNextPage}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        >
          <ul role="list" className="space-y-3" aria-label="검색 결과 목록">
            {restaurants.map((restaurant, idx) => (
              <li key={restaurant.id} className="animate-fade-in">
                <a
                  href={`/restaurant/${restaurant.id}`}
                  className="block card p-4 hover:shadow-card-hover transition-shadow duration-150 focus-ring"
                  aria-label={`${restaurant.name} 상세 보기`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {restaurant.totalSanctions > 0 && (
                          <span className="text-2xs font-bold text-severity-high bg-orange-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            처분 {restaurant.totalSanctions}건
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-2xs font-medium px-1.5 py-0.5 rounded-full',
                            STATUS_COLOR[restaurant.status],
                          )}
                        >
                          {STATUS_LABEL[restaurant.status]}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-navy line-clamp-1 mb-0.5">
                        {restaurant.name}
                      </h3>

                      <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{restaurant.roadAddress}</span>
                      </p>

                      <div className="flex items-center gap-3 text-2xs text-gray-400">
                        <span>{restaurant.category}</span>
                        {restaurant.lastSanctionAt && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>최근 처분: {new Date(restaurant.lastSanctionAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1"
                      aria-hidden="true"
                    />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </InfiniteScroll>

        {/* Empty state */}
        {!isLoading && restaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-gray-300" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-1">검색 결과가 없습니다</h3>
            <p className="text-sm text-gray-400">
              다른 검색어나 필터를 사용해 보세요
            </p>
          </div>
        )}
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-navy/20" />
    </div>}>
      <SearchContent />
    </Suspense>
  )
}
