import { AlertTriangle, AlertOctagon, AlertCircle, Info, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SanctionSeverity } from '@safedeliver/shared-types'

interface SeverityConfig {
  label: string
  sublabel: string
  bgColor: string
  textColor: string
  borderColor: string
  Icon: React.ComponentType<{ className?: string }>
  level: number
}

const SEVERITY_CONFIG: Record<SanctionSeverity, SeverityConfig> = {
  CRITICAL: {
    label: '심각',
    sublabel: '영업취소·폐쇄명령',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    Icon: AlertOctagon,
    level: 5,
  },
  HIGH: {
    label: '높음',
    sublabel: '영업정지 2개월 이상',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    Icon: AlertTriangle,
    level: 4,
  },
  MEDIUM: {
    label: '보통',
    sublabel: '영업정지·과징금',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    Icon: AlertCircle,
    level: 3,
  },
  LOW: {
    label: '낮음',
    sublabel: '시정명령',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    Icon: Info,
    level: 2,
  },
}

// MEDIUM repurposed for the 4-level enum; map UNKNOWN -> minimal
const MINIMAL_CONFIG: SeverityConfig = {
  label: '주의',
  sublabel: '경고',
  bgColor: 'bg-slate-50',
  textColor: 'text-slate-600',
  borderColor: 'border-slate-200',
  Icon: Minus,
  level: 1,
}

type BadgeVariant = 'default' | 'compact' | 'dot'

interface SeverityBadgeProps {
  severity: SanctionSeverity
  variant?: BadgeVariant
  className?: string
  showSubLabel?: boolean
}

export function SeverityBadge({
  severity,
  variant = 'default',
  className,
  showSubLabel = false,
}: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] ?? MINIMAL_CONFIG
  const { label, sublabel, bgColor, textColor, borderColor, Icon, level } = config

  if (variant === 'dot') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-medium',
          textColor,
          className,
        )}
        aria-label={`심각도: ${label}`}
      >
        <span
          className={cn('severity-dot', {
            'bg-severity-critical': level === 5,
            'bg-severity-high': level === 4,
            'bg-severity-medium': level === 3,
            'bg-severity-low': level === 2,
            'bg-severity-minimal': level === 1,
          })}
          aria-hidden="true"
        />
        {label}
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
          bgColor,
          textColor,
          borderColor,
          className,
        )}
        aria-label={`심각도: ${label}`}
      >
        <Icon className="w-3 h-3" aria-hidden="true" />
        {label}
      </span>
    )
  }

  // default variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border',
        bgColor,
        textColor,
        borderColor,
        className,
      )}
      role="status"
      aria-label={`심각도: ${label}${showSubLabel ? ` (${sublabel})` : ''}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold leading-tight">{label}</span>
        {showSubLabel && (
          <span className="text-2xs leading-tight opacity-75">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
