'use client'

import { useParams, notFound } from 'next/navigation'
import {
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
  Loader2,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { SanctionTimelineItem } from '@/components/ui/sanction-card'
import { useRestaurant } from '@/hooks/use-restaurants'
import { useRestaurantSanctions } from '@/hooks/use-sanctions'
import { formatKoreanDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  SanctionSeverity,
  SanctionType,
  RestaurantStatus,
  type RestaurantDto,
  type SanctionDto,
} from '@safedeliver/shared-types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RestaurantStatus, { label: string; color: string; bg: string; icon: any }> = {
  [RestaurantStatus.ACTIVE]: {
    label: '영업 중',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: ShieldCheck,
  },
  [RestaurantStatus.SUSPENDED]: {
    label: '영업정지',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    icon: ShieldAlert,
  },
  [RestaurantStatus.CLOSED]: {
    label: '폐업',
    color: 'text-gray-500',
    bg: 'bg-gray-50 border-gray-200',
    icon: ShieldAlert,
  },
  [RestaurantStatus.UNKNOWN]: {
    label: '확인 불가',
    color: 'text-gray-400',
    bg: 'bg-gray-50 border-gray-200',
    icon: AlertTriangle,
  },
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function RestaurantDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: restaurant, isLoading: isRestaurantLoading, error: restaurantError } = useRestaurant(id)
  const { data: sanctions = [], isLoading: isSanctionsLoading } = useRestaurantSanctions(id)

  if (isRestaurantLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-navy/20" />
      </div>
    )
  }

  if (restaurantError || !restaurant) {
    notFound()
  }

  const statusConfig = STATUS_CONFIG[restaurant.status]
  const StatusIcon = statusConfig.icon

  const latestSanction = sanctions[0]
  const hasCriticalHistory = sanctions.some(
    (s) => s.severity === SanctionSeverity.CRITICAL || s.severity === SanctionSeverity.HIGH,
  )

  return (
    <>
      <Header
        showBack
        rightSlot={
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="북마크 추가"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors duration-150 focus-ring"
            >
              <Bookmark className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="공유하기"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors duration-150 focus-ring"
            >
              <Share2 className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        }
      />

      <div className="animate-slide-up pb-20">

        {/* Restaurant hero card */}
        <section
          className="px-4 pt-2 pb-4"
          aria-label={`${restaurant.name} 기본 정보`}
        >
          <div className="card p-4">
            {/* Status + category row */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
                  statusConfig.bg,
                  statusConfig.color,
                )}
              >
                <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                {statusConfig.label}
              </span>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                {restaurant.category}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-xl font-black text-navy leading-tight mb-3 text-balance">
              {restaurant.name}
            </h1>

            {/* Address */}
            {restaurant.roadAddress && (
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-gray-600">{restaurant.roadAddress}</p>
              </div>
            )}

            {/* Last sanction date */}
            {restaurant.lastSanctionAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-gray-600">
                  최근 처분:{' '}
                  <time dateTime={restaurant.lastSanctionAt} className="font-medium">
                    {formatKoreanDate(restaurant.lastSanctionAt)}
                  </time>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Warning banner for active suspension */}
        {restaurant.status === RestaurantStatus.SUSPENDED && (
          <section className="px-4 mb-4" aria-label="현재 영업정지 안내">
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-200">
              <ShieldAlert className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-orange-800 mb-0.5">현재 영업정지 상태입니다</p>
                {latestSanction && (
                  <p className="text-xs text-orange-700 leading-relaxed">
                    {latestSanction.dispositionContent}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Sanction stats */}
        <section
          className="px-4 mb-4"
          aria-labelledby="stats-heading"
        >
          <h2 id="stats-heading" className="section-title mb-3">처분 통계</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <p className="text-2xl font-black text-navy leading-none">{restaurant.totalSanctions}</p>
              <p className="text-2xs text-gray-500 mt-1">총 처분 건수</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-black text-severity-high leading-none">
                {sanctions.filter((s) => s.severity === SanctionSeverity.HIGH || s.severity === SanctionSeverity.CRITICAL).length}
              </p>
              <p className="text-2xs text-gray-500 mt-1">고위험 처분</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-black text-emerald-600 leading-none">
                {sanctions.filter((s) => s.isVerified).length}
              </p>
              <p className="text-2xs text-gray-500 mt-1">검증된 처분</p>
            </div>
          </div>
        </section>

        {/* Risk assessment */}
        <section className="px-4 mb-4" aria-label="위험도 평가">
          <div
            className={cn(
              'flex items-start gap-3 p-4 rounded-2xl border',
              hasCriticalHistory
                ? 'bg-red-50 border-red-200'
                : 'bg-navy-tint border-navy/10',
            )}
          >
            {hasCriticalHistory ? (
              <AlertTriangle className="w-5 h-5 text-severity-critical flex-shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-navy flex-shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div>
              <p className={cn(
                'text-sm font-bold mb-0.5',
                hasCriticalHistory ? 'text-red-800' : 'text-navy',
              )}>
                {hasCriticalHistory ? '주의가 필요한 업체입니다' : '상대적으로 양호한 업체입니다'}
              </p>
              <p className={cn(
                'text-xs leading-relaxed',
                hasCriticalHistory ? 'text-red-700' : 'text-navy/70',
              )}>
                {hasCriticalHistory
                  ? '고위험 행정처분 이력이 있습니다. 주문 전 최신 처분 내용을 확인해 주세요.'
                  : '최근 고위험 처분 이력이 없습니다. 그러나 정기적으로 현황을 확인하시길 권장합니다.'}
              </p>
            </div>
          </div>
        </section>

        {/* Sanctions timeline */}
        <section
          className="px-4 mb-6"
          aria-labelledby="timeline-heading"
        >
          <h2 id="timeline-heading" className="section-title mb-4">행정처분 이력</h2>

          {isSanctionsLoading ? (
             <div className="space-y-4">
               {[1, 2].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}
             </div>
          ) : sanctions.length === 0 ? (
            <div className="card p-8 text-center">
              <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-500">행정처분 이력이 없습니다</p>
            </div>
          ) : (
            <div
              className="card p-4"
              role="list"
              aria-label="행정처분 이력 타임라인"
            >
              {sanctions.map((sanction, idx) => (
                <div key={sanction.id} role="listitem">
                  <SanctionTimelineItem
                    sanction={sanction}
                    isLatest={idx === 0}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* External links */}
        <section className="px-4 mb-6">
          <h2 className="section-title mb-3">추가 정보 확인</h2>
          <div className="grid grid-cols-2 gap-3">
             <a 
               href={`https://search.naver.com/search.naver?query=${encodeURIComponent(restaurant.roadAddress + ' ' + restaurant.name)}`}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 p-3 bg-[#03C75A] text-white rounded-xl text-sm font-bold"
             >
               네이버 검색
               <ExternalLink className="w-4 h-4" />
             </a>
             <a 
               href={`https://map.kakao.com/?q=${encodeURIComponent(restaurant.roadAddress + ' ' + restaurant.name)}`}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 p-3 bg-[#FAE100] text-[#3C1E1E] rounded-xl text-sm font-bold"
             >
               카카오맵
               <ExternalLink className="w-4 h-4" />
             </a>
          </div>
        </section>

        {/* Source attribution */}
        <section className="px-4">
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-gray-500 leading-relaxed">
              데이터 출처: 식품의약품안전처 식품안전나라 및{' '}
              {latestSanction?.source ?? '각 지자체 공개 데이터'}.
              처분 이후 상황은 달라질 수 있으므로 참고 용도로만 활용하세요.
            </p>
          </div>
        </section>

      </div>
    </>
  )
}
