'use client'

import { useParams } from 'next/navigation'
import { useLocalBookmarks } from '@/hooks/use-bookmarks-local'
import {
  MapPin,
  Phone,
  User,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Bookmark,
  BookmarkCheck,
  Building2,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useRestaurantDetail } from '@/hooks/use-restaurant-detail'
import type { RestaurantDetailSanctionItem } from '@/hooks/use-restaurant-detail'
import { formatKoreanDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────


const SANCTION_TYPE_LABELS: Record<string, string> = {
  LICENSE_SUSPENSION: '영업정지',
  LICENSE_REVOCATION: '영업취소',
  IMPROVEMENT_ORDER: '시정명령',
  FINE: '과징금·과태료',
  WARNING: '경고',
  CLOSURE_ORDER: '폐쇄명령',
  OTHER: '기타',
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#22C55E',
}

const SEVERITY_BG: Record<string, string> = {
  CRITICAL: 'bg-red-50 border-red-200 text-red-700',
  HIGH: 'bg-orange-50 border-orange-200 text-orange-700',
  MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  LOW: 'bg-green-50 border-green-200 text-green-700',
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: '심각',
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="pb-24 max-w-screen-md mx-auto animate-pulse">
      <div className="px-4 pt-4 pb-6">
        <div className="card p-6 space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-lg bg-gray-200" />
            <div className="h-6 w-24 rounded-lg bg-gray-200" />
          </div>
          <div className="h-8 w-3/4 rounded-lg bg-gray-200" />
          <div className="h-5 w-full rounded-lg bg-gray-100" />
          <div className="h-5 w-2/3 rounded-lg bg-gray-100" />
        </div>
      </div>
      <div className="px-4 mb-8">
        <div className="h-6 w-32 rounded-lg bg-gray-200 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-3 h-3 rounded-full bg-gray-200 mt-1.5 flex-shrink-0" />
              <div className="flex-1 pb-6 space-y-2">
                <div className="h-5 w-40 rounded-lg bg-gray-200" />
                <div className="h-4 w-full rounded-lg bg-gray-100" />
                <div className="h-4 w-3/4 rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Not found ────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-black text-gray-800 mb-2">업소를 찾을 수 없습니다</h2>
      <p className="text-sm text-gray-500 font-medium">
        요청하신 업소 정보가 존재하지 않거나 삭제되었습니다.
      </p>
    </div>
  )
}

// ─── Timeline item ────────────────────────────────────────────────────────────

function TimelineItem({
  sanction,
  isLatest,
}: {
  sanction: RestaurantDetailSanctionItem
  isLatest: boolean
}) {
  const typeLabel = SANCTION_TYPE_LABELS[sanction.sanctionType] ?? sanction.sanctionType
  const severityBg = SEVERITY_BG[sanction.severity] ?? 'bg-gray-50 border-gray-200 text-gray-600'
  const severityLabel = SEVERITY_LABELS[sanction.severity] ?? sanction.severity
  const dotColor = SEVERITY_COLORS[sanction.severity] ?? '#9CA3AF'

  return (
    <div className="flex gap-4 group">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-3 h-3 rounded-full mt-1.5 border-2 border-white z-10 flex-shrink-0"
          style={{ backgroundColor: dotColor, boxShadow: isLatest ? `0 0 8px ${dotColor}80` : undefined }}
          aria-hidden="true"
        />
        <div className="w-0.5 flex-1 bg-gray-100 group-last:bg-transparent -mt-0.5" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="pb-7 min-w-0 flex-1">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
              severityBg,
            )}
          >
            {severityLabel}
          </span>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
            {typeLabel}
          </span>
          {isLatest && (
            <span className="text-xs font-black text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">
              최신
            </span>
          )}
        </div>

        {/* Date */}
        {sanction.dispositionDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <time dateTime={sanction.dispositionDate}>
              {formatKoreanDate(sanction.dispositionDate)}
            </time>
            {sanction.dispositionStartDate && sanction.dispositionEndDate && (
              <span className="text-gray-400">
                ({formatKoreanDate(sanction.dispositionStartDate)} ~{' '}
                {formatKoreanDate(sanction.dispositionEndDate)})
              </span>
            )}
          </div>
        )}

        {/* Violation content */}
        {sanction.violationContent && (
          <p className="text-sm text-gray-700 font-medium leading-relaxed mb-2 line-clamp-3">
            {sanction.violationContent}
          </p>
        )}

        {/* Disposition content */}
        {sanction.dispositionContent && (
          <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 mb-2">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-0.5">처분내용</p>
            <p className="text-sm text-gray-700 font-semibold leading-snug">
              {sanction.dispositionContent}
            </p>
          </div>
        )}

        {/* Violated law */}
        {sanction.violatedLaw && (
          <p className="text-xs text-gray-400 font-medium">
            근거 법령: {sanction.violatedLaw}
          </p>
        )}

        {/* Disposition agency */}
        {sanction.dispositionAgency && (
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            처분기관: {sanction.dispositionAgency}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function RestaurantDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { restaurant, sanctions, isLoading, error } = useRestaurantDetail(id)

  const { addBookmark, removeBookmark, isBookmarked: checkBookmarked } = useLocalBookmarks()
  const bookmarked = checkBookmarked(id)

  function toggleBookmark() {
    if (bookmarked) {
      removeBookmark(id)
    } else if (restaurant) {
      addBookmark({ id, name: restaurant.name, category: restaurant.category })
    }
  }

  if (isLoading) {
    return (
      <>
        <Header showBack title="음식점 상세" />
        <DetailSkeleton />
      </>
    )
  }

  if (error || !restaurant) {
    return (
      <>
        <Header showBack title="음식점 상세" />
        <NotFound />
      </>
    )
  }

  // Sort sanctions by date descending
  const sortedSanctions = [...sanctions].sort((a, b) => {
    const da = a.dispositionDate ?? ''
    const db = b.dispositionDate ?? ''
    return db.localeCompare(da)
  })

  const hasCriticalHistory = sortedSanctions.some(
    (s) => s.severity === 'CRITICAL' || s.severity === 'HIGH',
  )

  const highRiskCount = sortedSanctions.filter(
    (s) => s.severity === 'CRITICAL' || s.severity === 'HIGH',
  ).length

  return (
    <>
      <Header
        showBack
        title={restaurant.name}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100"
        rightSlot={
          <button
            type="button"
            onClick={toggleBookmark}
            aria-label={bookmarked ? '북마크 제거' : '북마크 추가'}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200',
              bookmarked
                ? 'text-navy bg-navy/10 hover:bg-navy/20'
                : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200',
            )}
          >
            {bookmarked ? (
              <BookmarkCheck className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Bookmark className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        }
      />

      <div className="animate-slide-up pb-24 max-w-screen-md mx-auto">

        {/* Restaurant hero card */}
        <section className="px-4 pt-4 pb-6" aria-label={`${restaurant.name} 기본 정보`}>
          <div className="card p-6 border-navy/5 shadow-sm">
            {/* Category badge */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {restaurant.category && (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 uppercase tracking-tight">
                  {restaurant.category}
                </span>
              )}
              {restaurant.regionName && (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                  {restaurant.regionName}
                </span>
              )}
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
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-snug pt-1">
                  {restaurant.roadAddress}
                </p>
              </div>
            )}

            {/* Phone */}
            {restaurant.phone && (
              <div className="flex items-center gap-2.5 mb-3 group">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-navy-tint transition-colors">
                  <Phone className="w-4 h-4 text-gray-400 group-hover:text-navy" aria-hidden="true" />
                </div>
                <a
                  href={`tel:${restaurant.phone}`}
                  className="text-sm sm:text-base text-gray-600 font-medium hover:text-navy transition-colors"
                >
                  {restaurant.phone}
                </a>
              </div>
            )}

            {/* Representative */}
            {restaurant.representative && (
              <div className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-navy-tint transition-colors">
                  <User className="w-4 h-4 text-gray-400 group-hover:text-navy" aria-hidden="true" />
                </div>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  대표자: {restaurant.representative}
                </p>
              </div>
            )}
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
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md',
                hasCriticalHistory ? 'bg-red-500 text-white' : 'bg-navy text-white',
              )}
            >
              {hasCriticalHistory ? (
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              ) : (
                <ShieldCheck className="w-6 h-6" aria-hidden="true" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  'text-lg font-black mb-1 leading-tight',
                  hasCriticalHistory ? 'text-red-900' : 'text-navy',
                )}
              >
                {hasCriticalHistory ? '주의가 필요한 업체입니다' : '상대적으로 양호한 업체입니다'}
              </p>
              <p
                className={cn(
                  'text-sm font-medium leading-relaxed',
                  hasCriticalHistory ? 'text-red-700/80' : 'text-navy/70',
                )}
              >
                {hasCriticalHistory
                  ? `고위험 행정처분 이력 ${highRiskCount}건이 있습니다. 주문 전 최신 처분 내용을 확인해 주세요.`
                  : '최근 고위험 처분 이력이 없습니다. 그러나 정기적으로 현황을 확인하시길 권장합니다.'}
              </p>
            </div>
          </div>
        </section>

        {/* Sanctions stats */}
        <section className="px-4 mb-8" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="section-title mb-4 px-1">처분 통계</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-5 text-center border-navy/5">
              <p className="text-3xl font-black text-navy leading-none mb-2">
                {sortedSanctions.length}
              </p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">전체</p>
            </div>
            <div className="card p-5 text-center border-red-100 bg-red-50/30">
              <p className="text-3xl font-black text-red-600 leading-none mb-2">
                {highRiskCount}
              </p>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">고위험</p>
            </div>
          </div>
        </section>

        {/* Sanctions timeline */}
        <section className="px-4 mb-10" aria-labelledby="timeline-heading">
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 id="timeline-heading" className="section-title">행정처분 이력</h2>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Timeline
            </span>
          </div>

          {sortedSanctions.length === 0 ? (
            <div className="card p-12 text-center border-dashed border-2 bg-gray-50/50">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <ShieldCheck className="w-8 h-8 text-emerald-400" aria-hidden="true" />
              </div>
              <p className="text-base font-black text-gray-700 mb-1">행정처분 이력이 없습니다</p>
              <p className="text-sm text-gray-400 font-medium">
                관리 기관에 의해 보고된 위반 사항이 없습니다.
              </p>
            </div>
          ) : (
            <div
              className="card p-6 shadow-sm border-navy/5"
              role="list"
              aria-label="행정처분 이력 타임라인"
            >
              <div className="relative">
                {sortedSanctions.map((sanction, idx) => (
                  <div key={sanction.id} role="listitem">
                    <TimelineItem sanction={sanction} isLatest={idx === 0} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Source attribution */}
        <section className="px-4">
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-gray-500 leading-relaxed">
              데이터 출처: 식품의약품안전처 식품안전나라 공개 데이터 (I2630 행정처분결과).
              처분 이후 상황은 달라질 수 있으므로 참고 용도로만 활용하세요.
            </p>
          </div>
        </section>

      </div>
    </>
  )
}
