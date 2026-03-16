'use client'

import { ChevronLeft, Bell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

interface HeaderProps {
  title?: string
  showBack?: boolean
  showNotification?: boolean
  transparent?: boolean
  className?: string
  rightSlot?: React.ReactNode
}

export function Header({
  title,
  showBack = false,
  showNotification = false,
  transparent = false,
  className,
  rightSlot,
}: HeaderProps) {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 flex items-center px-4 transition-all duration-300 md:hidden',
        isScrolled ? 'h-12 bg-background/90 backdrop-blur-lg border-b shadow-sm' : 'h-14 bg-background',
        transparent && !isScrolled ? 'bg-transparent border-transparent' : '',
        className,
      )}
    >
      <div className="flex-none flex items-center">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="뒤로 가기"
            className="h-9 w-9 -ml-2 rounded-full"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
          </Button>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-center">
        {title ? (
          <h1 className={cn(
            'font-bold text-foreground truncate transition-all duration-300',
            isScrolled ? 'text-sm' : 'text-base'
          )}>
            {title}
          </h1>
        ) : (
          <Link
            href="/"
            aria-label="SafeDeliver 홈으로"
            className="focus-ring rounded inline-flex items-baseline gap-1"
          >
            <span className="text-lg font-black text-navy tracking-tight dark:text-white">
              Safe
            </span>
            <span className="text-lg font-black text-severity-critical tracking-tight">
              Deliver
            </span>
          </Link>
        )}
      </div>

      <div className="flex-none flex items-center gap-1">
        {rightSlot}
        {showNotification && (
          <Link href="/alerts">
            <Button
              variant="ghost"
              size="icon"
              aria-label="알림 보기"
              className="h-9 w-9 rounded-full relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
