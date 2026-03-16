'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, Suspense, useMemo } from 'react'
import { SlidersHorizontal, X, MapPin, AlertTriangle, ChevronRight, Search as SearchIcon, Filter, ArrowUpDown } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/ui/search-bar'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { PageContainer } from '@/components/layout/page-container'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
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

const STATUS_CONFIG: Record<RestaurantStatus, { label: string, variant: 'secondary' | 'destructive' | 'outline' | 'default' }> = {
  [RestaurantStatus.ACTIVE]: { label: '영업 중', variant: 'secondary' },
  [RestaurantStatus.SUSPENDED]: { label: '영업정지', variant: 'destructive' },
  [RestaurantStatus.CLOSED]: { label: '폐업', variant: 'outline' },
  [RestaurantStatus.UNKNOWN]: { label: '알 수 없음', variant: 'outline' },
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
    <PageContainer noPadding className="bg-background">
      <Header showBack title="검색 결과" />

      {/* Desktop sidebar layout placeholder - real sidebar is in layout.tsx */}
      <div className="flex flex-col w-full max-w-6xl mx-auto">
        
        {/* Search & Header Section */}
        <section className="bg-background border-b sticky top-12 sm:top-0 z-30 px-4 sm:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <SearchIcon className="w-6 h-6 text-primary" />
              음식점 검색
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {query && (
                <span>
                  <span className="font-bold text-foreground">"{query}"</span> 검색 결과
                </span>
              )}
              <Badge variant="secondary" className="font-bold">
                {MOCK_RESULTS.length}건
              </Badge>
            </div>
          </div>
          <SearchBar defaultValue={query} size="lg" className="max-w-3xl" />
        </section>

        {/* Filter & Sort Section */}
        <section className="sticky top-[calc(3rem+4rem)] sm:top-[calc(6.5rem)] z-20 bg-background/90 backdrop-blur-md border-b px-4 sm:px-8 py-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0 flex-1">
              <div className="flex-shrink-0 flex items-center gap-1.5 pr-2 border-r mr-2">
                <Filter className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold whitespace-nowrap">필터</span>
              </div>
              
              {hasActiveFilters && (
                <Chip
                  label={`${activeFilters.size}개 초기화`}
                  onClick={clearFilters}
                  active
                  className="bg-primary/20 text-primary hover:bg-primary/30"
                />
              )}

              {FILTER_CHIPS.map((chip) => (
                <Chip
                  key={chip.id}
                  label={chip.label}
                  active={activeFilters.has(chip.id)}
                  onClick={() => toggleFilter(chip.id)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center p-1 bg-muted rounded-lg text-xs font-bold">
                {[
                  { id: 'recent', label: '최신순' },
                  { id: 'severity', label: '심각도' },
                  { id: 'count', label: '처분건수' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-md transition-all",
                      sortBy === opt.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Results Grid */}
        <div className="px-4 sm:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_RESULTS.map((restaurant, idx) => {
              const status = STATUS_CONFIG[restaurant.status]
              return (
                <Link
                  key={restaurant.id}
                  href={`/restaurant/${restaurant.id}`}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <Card hover className="h-full border-muted/50 transition-all duration-300">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <SeverityBadge severity={restaurant.lastSeverity} variant="compact" />
                          <Badge variant={status.variant} className="text-[10px] h-5 uppercase font-bold">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="p-1.5 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
                        {restaurant.name}
                      </h3>

                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                        <span>{restaurant.address}</span>
                      </p>

                      <div className="mt-auto pt-4 border-t flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            처분 {restaurant.totalSanctions}건
                          </span>
                          <span className="opacity-30">|</span>
                          <span>{restaurant.category}</span>
                        </div>
                        <time className="italic opacity-60">최근 {restaurant.lastSanctionDate}</time>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Empty state */}
          {MOCK_RESULTS.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <SearchIcon className="w-10 h-10 text-muted-foreground/30" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">검색 결과가 없습니다</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                검색어를 확인하거나 필터를 초기화하여<br />다시 시도해 보세요.
              </p>
              <Button onClick={clearFilters} variant="outline" className="mt-6 rounded-xl font-bold">
                필터 초기화하기
              </Button>
            </div>
          )}

          {/* Load more */}
          <div className="py-12 flex flex-col items-center gap-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Showing {MOCK_RESULTS.length} of 142 restaurants</p>
            <Button
              variant="outline"
              className="h-11 px-10 rounded-2xl font-bold border-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              더 보기
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-xs">Searching for safety...</div>}>
      <SearchContent />
    </Suspense>
  )
}
