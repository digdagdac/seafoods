import { Calendar, MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SeverityBadge } from './severity-badge'
import { formatKoreanDate, formatRelativeTime, truncate } from '@/lib/utils'
import type { SanctionDto, RestaurantDto, SanctionSeverity } from '@safedeliver/shared-types'

const SANCTION_TYPE_LABELS: Record<string, string> = {
  LICENSE_SUSPENSION: '영업정지',
  LICENSE_REVOCATION: '영업취소',
  IMPROVEMENT_ORDER: '시정명령',
  FINE: '과징금·과태료',
  WARNING: '경고',
  CLOSURE_ORDER: '폐쇄명령',
  OTHER: '기타',
}

const SEVERITY_BORDER: Record<SanctionSeverity, string> = {
  CRITICAL: 'border-l-severity-critical',
  HIGH: 'border-l-severity-high',
  MEDIUM: 'border-l-severity-medium',
  LOW: 'border-l-severity-low',
}

interface SanctionCardProps {
  sanction: SanctionDto
  restaurant?: RestaurantDto
  showRestaurantName?: boolean
  className?: string
}

export function SanctionCard({
  sanction,
  restaurant,
  showRestaurantName = true,
  className,
}: SanctionCardProps) {
  const borderColor = SEVERITY_BORDER[sanction.severity] ?? 'border-l-slate-400'
  const typeLabel = SANCTION_TYPE_LABELS[sanction.sanctionType] ?? sanction.sanctionType

  return (
    <article
      className={cn(
        'card border-l-4 p-4 transition-shadow duration-150 hover:shadow-card-hover',
        borderColor,
        className,
      )}
      aria-label={`${restaurant?.name ?? '음식점'} ${typeLabel} 행정처분`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SeverityBadge severity={sanction.severity} variant="compact" />
          <span className="text-xs font-medium text-gray-500 truncate">{typeLabel}</span>
        </div>
        {sanction.isVerified && (
          <span
            className="flex-shrink-0 text-2xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"
            aria-label="공식 검증된 처분"
          >
            검증됨
          </span>
        )}
      </div>

      {/* Restaurant name */}
      {showRestaurantName && restaurant && (
        <Link
          href={`/restaurant/${restaurant.id}`}
          className="group block mb-1 focus-ring rounded"
        >
          <h3 className="text-base font-bold text-navy group-hover:text-navy-medium transition-colors leading-tight line-clamp-1">
            {restaurant.name}
          </h3>
          {restaurant.roadAddress && (
            <p className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{restaurant.roadAddress}</span>
            </p>
          )}
        </Link>
      )}

      {/* Violation content */}
      <p className="text-sm text-gray-700 leading-relaxed mt-2 mb-3 line-clamp-2">
        {truncate(sanction.violationContent, 80)}
      </p>

      {/* Disposition detail */}
      <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
        <p className="text-xs text-gray-500 mb-0.5 font-medium">처분 내용</p>
        <p className="text-sm text-gray-800 font-medium line-clamp-2">
          {sanction.dispositionContent}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" aria-hidden="true" />
          <time dateTime={sanction.dispositionDate}>
            {formatKoreanDate(sanction.dispositionDate)}
          </time>
          <span className="text-gray-300 mx-1">·</span>
          {formatRelativeTime(sanction.dispositionDate)}
        </span>
        <span className="truncate max-w-[120px]">{sanction.source}</span>
      </div>
    </article>
  )
}

// ─── Compact variant for timeline use ────────────────────────────────────────

interface SanctionTimelineItemProps {
  sanction: SanctionDto
  isLatest?: boolean
}

export function SanctionTimelineItem({ sanction, isLatest }: SanctionTimelineItemProps) {
  const typeLabel = SANCTION_TYPE_LABELS[sanction.sanctionType] ?? sanction.sanctionType

  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0',
            isLatest ? 'bg-severity-critical animate-pulse-dot' : 'bg-gray-300',
          )}
          aria-hidden="true"
        />
        <div className="w-px flex-1 bg-gray-200 mt-1" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <SeverityBadge severity={sanction.severity} variant="compact" />
          <span className="text-xs text-gray-500">{typeLabel}</span>
          {isLatest && (
            <span className="text-2xs font-bold text-severity-critical">최신</span>
          )}
        </div>
        <p className="text-sm text-gray-700 line-clamp-2 mb-1">{sanction.violationContent}</p>
        <time
          className="text-xs text-gray-400"
          dateTime={sanction.dispositionDate}
        >
          {formatKoreanDate(sanction.dispositionDate)}
        </time>
      </div>
    </div>
  )
}
