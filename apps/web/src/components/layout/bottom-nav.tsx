'use client'

import { Home, Search, Map, Bell, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  matchPaths?: string[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: '홈',
    Icon: Home,
    matchPaths: ['/'],
  },
  {
    href: '/search',
    label: '검색',
    Icon: Search,
    matchPaths: ['/search'],
  },
  {
    href: '/map',
    label: '지도',
    Icon: Map,
    matchPaths: ['/map'],
  },
  {
    href: '/alerts',
    label: '알림',
    Icon: Bell,
    matchPaths: ['/alerts'],
  },
  {
    href: '/my',
    label: 'MY',
    Icon: User,
    matchPaths: ['/my'],
  },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(item: NavItem): boolean {
    if (item.href === '/' && pathname === '/') return true
    if (item.href !== '/' && pathname.startsWith(item.href)) return true
    return false
  }

  return (
    <nav
      aria-label="하단 네비게이션"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white/95 backdrop-blur-md shadow-nav',
        'pb-safe',
      )}
    >
      <ul
        role="list"
        className="flex items-stretch h-16 max-w-lg mx-auto"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-0.5',
                  'transition-all duration-150 active:scale-95',
                  'focus-visible:outline-none focus-visible:bg-navy-tint rounded-lg',
                )}
              >
                {/* Icon wrapper with active indicator */}
                <div className="relative">
                  <item.Icon
                    className={cn(
                      'w-5 h-5 transition-all duration-150',
                      active
                        ? 'text-navy stroke-[2.5px]'
                        : 'text-gray-400 stroke-[1.5px]',
                    )}
                    aria-hidden="true"
                  />
                  {/* Active dot */}
                  {active && (
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-navy"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-2xs font-medium leading-none mt-1 transition-colors duration-150',
                    active ? 'text-navy' : 'text-gray-400',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
