'use client'

import { Home, Search, Map, Bell, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/search', label: '검색', Icon: Search },
  { href: '/map', label: '지도', Icon: Map },
  { href: '/alerts', label: '알림', Icon: Bell },
  { href: '/my', label: 'MY', Icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <nav
      aria-label="하단 네비게이션"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-white/90 backdrop-blur-xl border-t border-gray-100',
        'pb-safe pt-1.5',
      )}
    >
      <ul
        role="list"
        className="flex items-center justify-around h-14 max-w-lg mx-auto px-2"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-0.5',
                  'transition-all duration-300 relative py-1 touch-manipulation',
                  active ? 'text-navy' : 'text-gray-400'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-xl transition-all duration-300',
                  active ? 'bg-navy/5 scale-110' : 'hover:bg-gray-50'
                )}>
                  <item.Icon
                    className={cn(
                      'w-6 h-6 transition-all duration-300',
                      active ? 'stroke-[2.5px]' : 'stroke-[2px]',
                    )}
                    aria-hidden="true"
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-black uppercase tracking-tighter transition-all duration-300',
                    active ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-0.5',
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-navy rounded-full blur-[1px]" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
