import { Calendar, MapPin, ExternalLink, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SeverityBadge } from './severity-badge'
import { Card, CardContent } from './card'
import { Badge } from './badge'
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
  const borderColor = SEVERITY_BORDER[sanction.severity] ?? 'border-l-muted'
  const typeLabel = SANCTION_TYPE_LABELS[sanction.sanctionType] ?? sanction.sanctionType

  return (
    <Card
      hover
      className={cn(
        'border-l-4 overflow-hidden group transition-all duration-300',
        borderColor,
        className,
      )}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
            <SeverityBadge severity={sanction.severity} variant="compact" />
            <Badge variant="outline" className="text-[10px] h-5 py-0">
              {typeLabel}
            </Badge>
          </div>
          {sanction.isVerified && (
            <Badge variant="success" className="gap-1 px-1.5 h-5 text-[10px]">
              <ShieldCheck className="w-2.5 h-2.5" />
              검증됨
            </Badge>
          )}
        </div>

        {/* Restaurant name */}
        {showRestaurantName && restaurant && (
          <Link
            href={`/restaurant/${restaurant.id}`}
            className="group/link block mb-2 focus-ring rounded-lg"
          >
            <h3 className="text-base sm:text-lg font-bold text-foreground group-hover/link:text-primary transition-colors leading-tight line-clamp-1">
              {restaurant.name}
            </h3>
            {restaurant.roadAddress && (
              <p className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{restaurant.roadAddress}</span>
              </p>
            )}
          </Link>
        )}

        {/* Violation content */}
        <p className="text-sm text-foreground/80 leading-relaxed mt-3 mb-4 line-clamp-2 sm:line-clamp-3">
          {truncate(sanction.violationContent, 100)}
        </p>

        {/* Disposition detail */}
        <div className="bg-muted/50 dark:bg-muted/20 rounded-xl px-4 py-3 mb-4 border border-border/50">
          <p className="text-[10px] text-muted-foreground mb-1 font-bold uppercase tracking-wider">처분 내용</p>
          <p className="text-sm text-foreground font-semibold leading-snug">
            {sanction.dispositionContent}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-3 mt-auto">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <time dateTime={sanction.dispositionDate}>
              {formatKoreanDate(sanction.dispositionDate)}
            </time>
            <span className="opacity-30">|</span>
            <span className="font-medium text-foreground/60">{formatRelativeTime(sanction.dispositionDate)}</span>
          </div>
          <span className="truncate max-w-[120px] italic">{sanction.source}</span>
        </div>
      </CardContent>
    </Card>
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
    <div className="flex gap-4 animate-fade-in group">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-3 h-3 rounded-full mt-1.5 flex-shrink-0 border-2 border-background z-10',
            isLatest ? 'bg-severity-critical shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'bg-muted-foreground/30',
          )}
          aria-hidden="true"
        />
        <div className="w-0.5 flex-1 bg-border group-last:bg-transparent -mt-1" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="pb-6 min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <SeverityBadge severity={sanction.severity} variant="compact" />
          <Badge variant="outline" className="text-[10px] h-5">{typeLabel}</Badge>
          {isLatest && (
            <Badge className="bg-severity-critical text-white border-none h-5 text-[10px] animate-pulse">LATEST</Badge>
          )}
        </div>
        <p className="text-sm text-foreground/90 font-medium line-clamp-2 mb-2 leading-relaxed">
          {sanction.violationContent}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <time dateTime={sanction.dispositionDate}>
            {formatKoreanDate(sanction.dispositionDate)}
          </time>
        </div>
      </div>
    </div>
  )
}
