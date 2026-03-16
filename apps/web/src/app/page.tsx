'use client'

import { Suspense } from 'react'
import { AlertTriangle, TrendingUp, MapPin, ChevronRight, ShieldAlert, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/ui/search-bar'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { SanctionCard } from '@/components/ui/sanction-card'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import { useRecentSanctions } from '@/hooks/use-sanctions'
import { useRegionSummary } from '@/hooks/use-regions'
import { SanctionSeverity } from '@safedeliver/shared-types'
import { formatKoreanDate } from '@/lib/utils'

const SEVERITY_BG: Record<SanctionSeverity, string> = {
  [SanctionSeverity.CRITICAL]: 'bg-red-50 border-red-100',
  [SanctionSeverity.HIGH]: 'bg-orange-50 border-orange-100',
  [SanctionSeverity.MEDIUM]: 'bg-amber-50 border-amber-100',
  [SanctionSeverity.LOW]: 'bg-blue-50 border-blue-100',
}

function RegionalSummary() {
  const { data: summary, isLoading, isError } = useRegionSummary('11') // Default to Seoul

  if (isLoading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-10 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card p-4 text-center text-sm text-gray-500">
        지역 정보를 불러올 수 없습니다. API 키를 설정해주세요.
      </div>
    )
  }

  if (!summary) return null

  return (
    <section aria-labelledby="region-summary-heading">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-navy" aria-hidden="true" />
            <h2 id="region-summary-heading" className="section-title">
              내 주변 행정처분 현황
            </h2>
          </div>
          <span className="text-xs text-gray-400">{summary.regionName}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-navy-light rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-navy leading-none">
              {summary.totalSanctions}
            </p>
            <p className="text-2xs text-gray-500 mt-1">누적 처분</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-severity-critical leading-none">
              {summary.criticalCount}
            </p>
            <p className="text-2xs text-gray-500 mt-1">심각</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-severity-high leading-none">
              {summary.highCount}
            </p>
            <p className="text-2xs text-gray-500 mt-1">높음</p>
          </div>
        </div>

        <Link
          href="/map"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-navy-tint text-navy text-sm font-semibold hover:bg-navy/10 transition-colors duration-150 focus-ring"
        >
          <MapPin className="w-4 h-4" aria-hidden="true" />
          지도에서 보기
        </Link>
      </div>
    </section>
  )
}

function RecentSanctionsFeed() {
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRecentSanctions(10)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-32 animate-pulse bg-gray-50" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card p-6 text-center text-sm text-gray-500">
        데이터를 불러올 수 없습니다. API 키를 설정해주세요.
      </div>
    )
  }

  const sanctions = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <section aria-labelledby="recent-sanctions-heading">
      <div className="flex items-center justify-between mb-3">
        <h2 id="recent-sanctions-heading" className="section-title flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
          최근 행정처분
        </h2>
        <Link
          href="/search?hasSanction=true"
          className="text-xs text-navy font-medium flex items-center gap-0.5 focus-ring rounded"
          aria-label="전체 행정처분 보기"
        >
          전체보기
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      <InfiniteScroll
        hasMore={!!hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      >
        <div className="space-y-3">
          {sanctions.map((sanction) => (
            <SanctionCard
              key={sanction.id}
              sanction={sanction}
              restaurant={sanction.restaurant}
            />
          ))}
        </div>
      </InfiniteScroll>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Header showNotification />

      {/* Hero search section */}
      <section className="bg-navy px-4 pt-4 pb-8" aria-label="음식점 검색">
        <div className="mb-4">
          <h2 className="text-xl font-black text-white leading-snug mb-1 text-balance">
            안전한 배달 음식을<br />
            <span className="text-navy-tint">직접 확인</span>하세요
          </h2>
          <p className="text-sm text-white/60">
            전국 음식점 행정처분 이력을 실시간으로 제공합니다
          </p>
        </div>
        <SearchBar size="lg" />
      </section>

      <div className="px-4 -mt-4 space-y-5 animate-slide-up pb-20">
        <RegionalSummary />

        {/* Severity legend */}
        <section aria-labelledby="severity-legend-heading">
          <h2 id="severity-legend-heading" className="section-title mb-3">
            처분 심각도 안내
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { severity: SanctionSeverity.CRITICAL, desc: '영업취소·폐쇄명령' },
              { severity: SanctionSeverity.HIGH, desc: '영업정지 2개월 이상' },
              { severity: SanctionSeverity.MEDIUM, desc: '영업정지·과징금' },
              { severity: SanctionSeverity.LOW, desc: '시정명령·경고' },
            ].map(({ severity, desc }) => (
              <div
                key={severity}
                className={`flex items-center gap-2.5 p-3 rounded-xl border ${SEVERITY_BG[severity]}`}
              >
                <SeverityBadge severity={severity} variant="compact" />
                <span className="text-2xs text-gray-600 leading-tight">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        <RecentSanctionsFeed />

        {/* Safety notice */}
        <section>
          <div className="flex items-start gap-3 p-4 bg-navy-tint rounded-2xl border border-navy/10 mb-2">
            <ShieldAlert className="w-5 h-5 text-navy flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-navy mb-0.5">데이터 출처 안내</p>
              <p className="text-xs text-navy/70 leading-relaxed">
                본 서비스의 행정처분 정보는 식품의약품안전처 및 각 지자체의
                공개 데이터를 기반으로 합니다. 처분 이후 상황은 다를 수 있습니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
