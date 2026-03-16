import { notFound } from 'next/navigation'
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
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { SanctionTimelineItem } from '@/components/ui/sanction-card'
import { formatKoreanDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  SanctionSeverity,
  SanctionType,
  RestaurantStatus,
  type RestaurantDto,
  type SanctionDto,
} from '@safedeliver/shared-types'
import type { Metadata } from 'next'

// ─── Mock data (replace with real fetch) ─────────────────────────────────────

const MOCK_RESTAURANTS: Record<string, RestaurantDto> = {
  '1': {
    id: '1',
    name: '맛있는 치킨',
    normalizedName: '맛있는치킨',
    category: '치킨',
    roadAddress: '서울특별시 강남구 역삼동 123-45',
    jibunAddress: '서울특별시 강남구 역삼동 123-45',
    latitude: 37.4979,
    longitude: 127.0276,
    regionCode: '1168010100',
    status: RestaurantStatus.SUSPENDED,
    totalSanctions: 3,
    lastSanctionAt: '2024-03-14',
  },
}

const MOCK_SANCTIONS: Record<string, SanctionDto[]> = {
  '1': [
    {
      id: 's1',
      restaurantId: '1',
      sanctionType: SanctionType.LICENSE_SUSPENSION,
      severity: SanctionSeverity.HIGH,
      violationContent: '유통기한 경과 식품 사용 및 보관 기준 위반',
      dispositionContent: '영업정지 2개월 (2024.03.14 ~ 2024.05.14)',
      dispositionDate: '2024-03-14',
      legalBasis: '식품위생법 제75조',
      source: '서울특별시 강남구청',
      isVerified: true,
    },
    {
      id: 's2',
      restaurantId: '1',
      sanctionType: SanctionType.IMPROVEMENT_ORDER,
      severity: SanctionSeverity.LOW,
      violationContent: '조리사 위생교육 미이수',
      dispositionContent: '시정명령 (30일 이내 이수 완료)',
      dispositionDate: '2023-11-20',
      legalBasis: '식품위생법 제41조',
      source: '서울특별시 강남구청',
      isVerified: true,
    },
    {
      id: 's3',
      restaurantId: '1',
      sanctionType: SanctionType.WARNING,
      severity: SanctionSeverity.LOW,
      violationContent: '식품 표시 기준 일부 미준수',
      dispositionContent: '경고 처분',
      dispositionDate: '2023-06-05',
      legalBasis: '식품위생법 제10조',
      source: '서울특별시 강남구청',
      isVerified: false,
    },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RestaurantStatus, { label: string; color: string; bg: string; icon: typeof ShieldCheck }> = {
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

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const restaurant = MOCK_RESTAURANTS[params.id]
  if (!restaurant) return { title: '음식점을 찾을 수 없습니다' }

  return {
    title: `${restaurant.name} 행정처분 이력`,
    description: `${restaurant.name}의 행정처분 이력을 확인하세요. 총 ${restaurant.totalSanctions}건의 처분 기록이 있습니다.`,
  }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function RestaurantDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const restaurant = MOCK_RESTAURANTS[params.id]
  if (!restaurant) notFound()

  const sanctions = MOCK_SANCTIONS[params.id] ?? []
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

      <div className="animate-slide-up">

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
              <p className="text-2xl font-black text-navy leading-none">{sanctions.length}</p>
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

          {sanctions.length === 0 ? (
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

        {/* Source attribution */}
        <section className="px-4 mb-6">
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
