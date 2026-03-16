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
        'bg-background/80 backdrop-blur-lg border-t',
        'pb-safe pt-2',
      )}
    >
      <ul
        role="list"
        className="flex items-center justify-around h-12 max-w-lg mx-auto"
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
                  'flex flex-col items-center justify-center h-full gap-1',
                  'transition-all duration-300 relative',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-xl transition-all duration-300',
                  active ? 'bg-primary/10 scale-110' : 'hover:bg-muted'
                )}>
                  <item.Icon
                    className={cn(
                      'w-5 h-5 transition-all duration-300',
                      active ? 'stroke-[2.5px]' : 'stroke-[1.5px]',
                    )}
                    aria-hidden="true"
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold transition-all duration-300',
                    active ? 'opacity-100 translate-y-0' : 'opacity-70 -translate-y-0.5',
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full blur-[2px] opacity-50" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
