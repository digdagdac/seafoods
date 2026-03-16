'use client'

import { ChevronLeft, Bell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
  showBack?: boolean
  showNotification?: boolean
  transparent?: boolean
  invert?: boolean
  className?: string
  rightSlot?: React.ReactNode
}

export function Header({
  title,
  showBack = false,
  showNotification = false,
  transparent = false,
  invert = false,
  className,
  rightSlot,
}: HeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center h-14 px-4 gap-2 transition-all duration-200',
        transparent
          ? 'bg-transparent border-none'
          : 'bg-white/95 backdrop-blur-md border-b border-gray-100',
        className,
      )}
    >
      {/* Back button */}
      {showBack && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className={cn(
            'flex items-center justify-center -ml-1 w-9 h-9 rounded-xl',
            invert ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40',
          )}
        >
          <ChevronLeft className="w-5 h-5 stroke-[2px]" aria-hidden="true" />
        </button>
      )}

      {/* Logo / Title */}
      <div className="flex-1 min-w-0">
        {title ? (
          <h1 className={cn(
            "text-base font-bold truncate leading-tight",
            invert ? "text-white" : "text-navy"
          )}>
            {title}
          </h1>
        ) : (
          <Link
            href="/"
            aria-label="SafeDeliver 홈으로"
            className="focus-ring rounded inline-flex items-baseline gap-1"
          >
            <span className={cn(
              "text-lg font-black tracking-tight",
              invert ? "text-white" : "text-navy"
            )}>
              Safe
            </span>
            <span className="text-lg font-black text-severity-critical tracking-tight">
              Deliver
            </span>
          </Link>
        )}
      </div>

      {/* Right slot */}
      {rightSlot && (
        <div className={cn(
            "flex items-center gap-1",
            invert ? "text-white" : "text-gray-700"
        )}>
          {rightSlot}
        </div>
      )}

      {/* Notification bell */}
      {showNotification && (
        <Link
          href="/alerts"
          aria-label="알림 보기"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-xl',
            invert ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40',
          )}
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
        </Link>
      )}
    </header>
  )
}
