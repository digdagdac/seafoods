import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [error, setError] = React.useState(false)

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full bg-muted select-none items-center justify-center font-bold text-muted-foreground uppercase',
        sizes[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span>{fallback || (alt ? alt.substring(0, 2) : '?')}</span>
      )}
    </div>
  )
}
