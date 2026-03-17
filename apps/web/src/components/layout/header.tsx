'use client'

import { ChevronLeft, Bell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center transition-all duration-300 px-4 gap-2',
        scrolled ? 'h-12 bg-white/95 backdrop-blur-md shadow-sm' : 'h-14 bg-white',
        transparent && !scrolled
          ? 'bg-transparent border-none'
          : 'border-b border-gray-100',
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
            invert ? 'text-white hover:bg-white/10' : 'text-navy hover:bg-navy-tint active:bg-navy/10',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40',
            scrolled && 'scale-90'
          )}
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5px]" aria-hidden="true" />
        </button>
      )}

      {/* Logo / Title */}
      <div className="flex-1 min-w-0">
        {title ? (
          <h1 className={cn(
            "text-base font-black truncate leading-tight transition-all duration-300",
            invert ? "text-white" : "text-navy",
            scrolled ? "text-sm" : "text-base"
          )}>
            {title}
          </h1>
        ) : (
          <Link
            href="/"
            aria-label="SafeDeliver 홈으로"
            className={cn(
              "focus-ring rounded inline-flex items-baseline gap-0.5 transition-transform duration-300 origin-left",
              scrolled && "scale-90"
            )}
          >
            <span className={cn(
              "text-lg font-black tracking-tighter",
              invert ? "text-white" : "text-navy"
            )}>
              SAFE
            </span>
            <span className="text-lg font-black text-red-500 tracking-tighter">
              DELIVER
            </span>
          </Link>
        )}
      </div>

      {/* Right slot */}
      {rightSlot && (
        <div className={cn(
            "flex items-center gap-1.5 transition-transform duration-300",
            invert ? "text-white" : "text-navy",
            scrolled && "scale-90"
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
            'flex items-center justify-center w-9 h-9 rounded-xl relative',
            invert ? 'text-white hover:bg-white/10' : 'text-navy hover:bg-navy-tint active:bg-navy/10',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40',
            scrolled && 'scale-90'
          )}
        >
          <Bell className="w-5 h-5 stroke-[2px]" aria-hidden="true" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </Link>
      )}
    </header>
  )
}
