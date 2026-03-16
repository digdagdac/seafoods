'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface ChipProps {
  label: string
  active?: boolean
  onClick?: () => void
  onRemove?: () => void
  className?: string
  icon?: React.ReactNode
}

export function Chip({
  label,
  active,
  onClick,
  onRemove,
  className,
  icon,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus-ring whitespace-nowrap',
        active
          ? 'bg-navy text-white shadow-sm'
          : 'bg-muted text-muted-foreground hover:bg-muted/80',
        onClick && 'cursor-pointer active:scale-95',
        !onClick && 'cursor-default',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </button>
  )
}
