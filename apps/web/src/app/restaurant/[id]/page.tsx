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
        title={restaurant.name}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100"
        rightSlot={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="북마크 추가"
              className="flex items-center justify-center w-10 h-10 rounded-2xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 focus-ring"
            >
              <Bookmark className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="공유하기"
              className="flex items-center justify-center w-10 h-10 rounded-2xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 focus-ring"
            >
              <Share2 className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        }
      />

      <div className="animate-slide-up pb-24 max-w-screen-md mx-auto">

        {/* Restaurant hero card */}
        <section
          className="px-4 pt-4 pb-6"
          aria-label={`${restaurant.name} 기본 정보`}
        >
          <div className="card p-6 border-navy/5 shadow-sm">
            {/* Status + category row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={cn(
                  'flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-lg border uppercase tracking-tight',
                  statusConfig.bg,
                  statusConfig.color,
                )}
              >
                <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                {statusConfig.label}
              </span>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 uppercase tracking-tight">
                {restaurant.category}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-2xl font-black text-navy leading-tight mb-4 text-balance">
              {restaurant.name}
            </h1>

            {/* Address */}
            {restaurant.roadAddress && (
              <div className="flex items-start gap-2.5 mb-3 group">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-navy-tint transition-colors">
                  <MapPin className="w-4 h-4 text-gray-400 group-hover:text-navy" aria-hidden="true" />
                </div>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-snug pt-1">{restaurant.roadAddress}</p>
              </div>
            )}

            {/* Last sanction date */}
            {restaurant.lastSanctionAt && (
              <div className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-50 transition-colors">
                  <Clock className="w-4 h-4 text-gray-400 group-hover:text-red-500" aria-hidden="true" />
                </div>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  최근 처분:{' '}
                  <time dateTime={restaurant.lastSanctionAt} className="font-black text-red-500">
                    {formatKoreanDate(restaurant.lastSanctionAt)}
                  </time>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Warning banner for active suspension */}
        {restaurant.status === RestaurantStatus.SUSPENDED && (
          <section className="px-4 mb-6" aria-label="현재 영업정지 안내">
            <div className="flex items-start gap-4 p-5 bg-red-50 rounded-3xl border-2 border-red-100 shadow-sm animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-200">
                <ShieldAlert className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div className="pt-0.5">
                <p className="text-base font-black text-red-900 mb-1">현재 영업정지 상태입니다</p>
                {latestSanction && (
                  <p className="text-sm text-red-700 font-medium leading-relaxed">
                    {latestSanction.dispositionContent}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Sanction stats */}
        <section
          className="px-4 mb-8"
          aria-labelledby="stats-heading"
        >
          <h2 id="stats-heading" className="section-title mb-4 px-1">처분 통계</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-5 text-center border-navy/5">
              <p className="text-3xl font-black text-navy leading-none mb-2">{restaurant.totalSanctions}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
            </div>
            <div className="card p-5 text-center border-red-100 bg-red-50/30">
              <p className="text-3xl font-black text-red-600 leading-none mb-2">
                {sanctions.filter((s) => s.severity === SanctionSeverity.HIGH || s.severity === SanctionSeverity.CRITICAL).length}
              </p>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">High Risk</p>
            </div>
            <div className="card p-5 text-center border-emerald-100 bg-emerald-50/30">
              <p className="text-3xl font-black text-emerald-600 leading-none mb-2">
                {sanctions.filter((s) => s.isVerified).length}
              </p>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified</p>
            </div>
          </div>
        </section>

        {/* Risk assessment */}
        <section className="px-4 mb-8" aria-label="위험도 평가">
          <div
            className={cn(
              'flex items-start gap-4 p-6 rounded-3xl border shadow-sm transition-all duration-300',
              hasCriticalHistory
                ? 'bg-red-50 border-red-100'
                : 'bg-navy-tint border-navy/10',
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md",
              hasCriticalHistory ? "bg-red-500 text-white" : "bg-navy text-white"
            )}>
              {hasCriticalHistory ? (
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              ) : (
                <ShieldCheck className="w-6 h-6" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className={cn(
                'text-lg font-black mb-1 leading-tight',
                hasCriticalHistory ? 'text-red-900' : 'text-navy',
              )}>
                {hasCriticalHistory ? '주의가 필요한 업체입니다' : '상대적으로 양호한 업체입니다'}
              </p>
              <p className={cn(
                'text-sm font-medium leading-relaxed',
                hasCriticalHistory ? 'text-red-700/80' : 'text-navy/70',
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
          className="px-4 mb-10"
          aria-labelledby="timeline-heading"
        >
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 id="timeline-heading" className="section-title">행정처분 이력</h2>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Timeline</span>
          </div>

          {isSanctionsLoading ? (
             <div className="space-y-4">
               {[1, 2].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}
             </div>
          ) : sanctions.length === 0 ? (
            <div className="card p-12 text-center border-dashed border-2 bg-gray-50/50">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <ShieldCheck className="w-8 h-8 text-emerald-400" aria-hidden="true" />
              </div>
              <p className="text-base font-black text-gray-700 mb-1">행정처분 이력이 없습니다</p>
              <p className="text-sm text-gray-400 font-medium">관리 기관에 의해 보고된 위반 사항이 없습니다.</p>
            </div>
          ) : (
            <div
              className="card p-6 shadow-sm border-navy/5"
              role="list"
              aria-label="행정처분 이력 타임라인"
            >
              <div className="space-y-0 relative">
                {/* Visual timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100" aria-hidden="true" />
                
                {sanctions.map((sanction, idx) => (
                  <div key={sanction.id} role="listitem">
                    <SanctionTimelineItem
                      sanction={sanction}
                      isLatest={idx === 0}
                    />
                  </div>
                ))}
              </div>
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
