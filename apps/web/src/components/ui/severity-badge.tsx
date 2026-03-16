import { AlertTriangle, AlertOctagon, AlertCircle, Info, Minus, ShieldAlert } from 'lucide-react'
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
  pattern?: string // For accessibility (background pattern or extra visual cue)
}

const SEVERITY_CONFIG: Record<SanctionSeverity, SeverityConfig> = {
  CRITICAL: {
    label: '심각',
    sublabel: '영업취소·폐쇄명령',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    Icon: ShieldAlert,
    level: 5,
  },
  HIGH: {
    label: '높음',
    sublabel: '영업정지 2개월 이상',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    Icon: AlertOctagon,
    level: 4,
  },
  MEDIUM: {
    label: '보통',
    sublabel: '영업정지·과징금',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    Icon: AlertTriangle,
    level: 3,
  },
  LOW: {
    label: '낮음',
    sublabel: '시정명령',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    Icon: AlertCircle,
    level: 2,
  },
}

const MINIMAL_CONFIG: SeverityConfig = {
  label: '주의',
  sublabel: '경고',
  bgColor: 'bg-slate-50 dark:bg-slate-900',
  textColor: 'text-slate-600 dark:text-slate-400',
  borderColor: 'border-slate-200 dark:border-slate-800',
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
  const isCritical = severity === 'CRITICAL'

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
          className={cn('severity-dot relative', {
            'bg-severity-critical': level === 5,
            'bg-severity-high': level === 4,
            'bg-severity-medium': level === 3,
            'bg-severity-low': level === 2,
            'bg-severity-minimal': level === 1,
          })}
          aria-hidden="true"
        >
          {isCritical && (
            <span className="absolute inset-0 rounded-full bg-severity-critical animate-ping opacity-75" />
          )}
        </span>
        {label}
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
          isCritical && 'animate-severity-pulse shadow-[0_0_12px_rgba(220,38,38,0.3)]',
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
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300',
        isCritical && 'animate-severity-pulse shadow-[0_0_15px_rgba(220,38,38,0.2)] ring-1 ring-red-400/20',
        bgColor,
        textColor,
        borderColor,
        className,
      )}
      role="status"
      aria-label={`심각도: ${label}${showSubLabel ? ` (${sublabel})` : ''}`}
    >
      <div className="relative">
        <Icon className="w-4 h-4 flex-shrink-0 relative z-10" aria-hidden="true" />
        {isCritical && (
          <div className="absolute inset-0 bg-red-400 blur-[8px] opacity-40 animate-pulse" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold leading-tight">{label}</span>
          {isCritical && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
        {showSubLabel && (
          <span className="text-2xs leading-tight opacity-75 font-medium">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
