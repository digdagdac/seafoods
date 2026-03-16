'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { SlidersHorizontal, X, MapPin, AlertTriangle, ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/ui/search-bar'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { cn } from '@/lib/utils'
import { SanctionSeverity, RestaurantStatus } from '@safedeliver/shared-types'

// ─── Filter definitions ───────────────────────────────────────────────────────

interface FilterChip {
  id: string
  label: string
  group: 'severity' | 'category' | 'status'
}

const FILTER_CHIPS: FilterChip[] = [
  { id: 'severity:CRITICAL', label: '심각', group: 'severity' },
  { id: 'severity:HIGH', label: '높음', group: 'severity' },
  { id: 'severity:MEDIUM', label: '보통', group: 'severity' },
  { id: 'severity:LOW', label: '낮음', group: 'severity' },
  { id: 'category:chicken', label: '치킨', group: 'category' },
  { id: 'category:chinese', label: '중식', group: 'category' },
  { id: 'category:korean', label: '한식', group: 'category' },
  { id: 'category:japanese', label: '일식', group: 'category' },
  { id: 'category:pizza', label: '피자', group: 'category' },
  { id: 'category:burger', label: '버거', group: 'category' },
  { id: 'status:SUSPENDED', label: '영업정지 중', group: 'status' },
  { id: 'status:ACTIVE', label: '영업 중', group: 'status' },
]

// ─── Mock results ─────────────────────────────────────────────────────────────

const MOCK_RESULTS = [
  {
    id: 'r1',
    name: '맛있는 치킨 강남점',
    category: '치킨',
    address: '서울 강남구 역삼동 123-45',
    status: RestaurantStatus.SUSPENDED,
    totalSanctions: 3,
    lastSeverity: SanctionSeverity.HIGH,
    lastSanctionDate: '2024-03-14',
  },
  {
    id: 'r2',
    name: '행복한 분식 홍대점',
    category: '분식',
    address: '서울 마포구 서교동 456-78',
    status: RestaurantStatus.ACTIVE,
    totalSanctions: 1,
    lastSeverity: SanctionSeverity.LOW,
    lastSanctionDate: '2024-03-13',
  },
  {
    id: 'r3',
    name: '신선한 해산물 잠실점',
    category: '해산물',
    address: '서울 송파구 잠실동 789-01',
    status: RestaurantStatus.CLOSED,
    totalSanctions: 5,
    lastSeverity: SanctionSeverity.CRITICAL,
    lastSanctionDate: '2024-03-12',
  },
  {
    id: 'r4',
    name: '달콤한 베이커리 인사동점',
    category: '베이커리',
    address: '서울 종로구 인사동 234-56',
    status: RestaurantStatus.ACTIVE,
    totalSanctions: 2,
    lastSeverity: SanctionSeverity.MEDIUM,
    lastSanctionDate: '2024-03-11',
  },
  {
    id: 'r5',
    name: '이탈리안 키친 명동점',
    category: '양식',
    address: '서울 중구 명동 345-67',
    status: RestaurantStatus.ACTIVE,
    totalSanctions: 1,
    lastSeverity: SanctionSeverity.LOW,
    lastSanctionDate: '2024-02-28',
  },
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
  const query = searchParams.get('q') ?? ''
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'recent' | 'severity' | 'count'>('recent')

  function toggleFilter(id: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function clearFilters() {
    setActiveFilters(new Set())
  }

  const hasActiveFilters = activeFilters.size > 0

  return (
    <>
      <Header showBack title="검색 결과" />

      {/* Search bar */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <SearchBar defaultValue={query} size="md" />
      </div>

      {/* Filter chips — horizontally scrollable */}
      <div className="sticky top-[calc(3.5rem+3.5rem)] z-20 bg-white border-b border-gray-100">
        <div
          className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none"
          role="group"
          aria-label="검색 필터"
        >
          {/* Clear button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              aria-label="필터 초기화"
              className="flex-shrink-0 chip chip-active gap-1 animate-fade-in"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              {activeFilters.size}개 선택됨
            </button>
          )}

          {FILTER_CHIPS.map((chip) => {
            const active = activeFilters.has(chip.id)
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggleFilter(chip.id)}
                aria-pressed={active}
                aria-label={`${chip.label} 필터 ${active ? '해제' : '적용'}`}
                className={cn('flex-shrink-0 chip', active ? 'chip-active' : 'chip-inactive')}
              >
                {chip.label}
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
      <div className="px-4 pt-4">
        {/* Result count */}
        <p className="text-xs text-gray-400 mb-3" aria-live="polite">
          {query ? (
            <>
              <span className="font-semibold text-navy">"{query}"</span> 검색 결과{' '}
              <span className="font-semibold text-navy">{MOCK_RESULTS.length}건</span>
            </>
          ) : (
            `전체 ${MOCK_RESULTS.length}건`
          )}
        </p>

        <ul role="list" className="space-y-3" aria-label="검색 결과 목록">
          {MOCK_RESULTS.map((restaurant, idx) => (
            <li key={restaurant.id} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <a
                href={`/restaurant/${restaurant.id}`}
                className="block card p-4 hover:shadow-card-hover transition-shadow duration-150 focus-ring"
                aria-label={`${restaurant.name} 상세 보기`}
              >
                <div className="flex items-start gap-3">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={restaurant.lastSeverity} variant="compact" />
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
                      <span className="truncate">{restaurant.address}</span>
                    </p>

                    <div className="flex items-center gap-3 text-2xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                        처분 {restaurant.totalSanctions}건
                      </span>
                      <span>최근: {restaurant.lastSanctionDate}</span>
                      <span className="text-gray-300">·</span>
                      <span>{restaurant.category}</span>
                    </div>
                  </div>

                  {/* Right: arrow */}
                  <ChevronRight
                    className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1"
                    aria-hidden="true"
                  />
                </div>
              </a>
            </li>
          ))}
        </ul>

        {/* Empty state */}
        {MOCK_RESULTS.length === 0 && (
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

        {/* Load more */}
        <div className="py-4 flex justify-center">
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-navy/30 hover:text-navy transition-colors duration-150 focus-ring"
          >
            더 보기
          </button>
        </div>
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400 text-sm">로딩 중...</div>}>
      <SearchContent />
    </Suspense>
  )
}
