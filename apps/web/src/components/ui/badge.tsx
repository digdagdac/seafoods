import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-primary text-primary-foreground border-transparent shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground border-transparent shadow-sm',
      outline: 'text-foreground border-border',
      destructive: 'bg-destructive text-destructive-foreground border-transparent shadow-sm',
      success: 'bg-teal-500 text-white border-transparent shadow-sm',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-ring',
          variants[variant as keyof typeof variants],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
