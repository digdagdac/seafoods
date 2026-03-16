'use client'

import { Home, Search, Map, Bell, User, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

const SIDEBAR_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/search', label: '검색', icon: Search },
  { href: '/map', label: '지도', icon: Map },
  { href: '/alerts', label: '알림', icon: Bell },
  { href: '/my', label: 'MY', icon: User },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col w-64 h-screen sticky top-0 bg-card border-r p-4 transition-all duration-300',
        className
      )}
    >
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-navy tracking-tight">Safe</span>
          <span className="text-xl font-black text-severity-critical tracking-tight">Deliver</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  active ? 'scale-110' : 'group-hover:scale-110'
                )}
              />
              <span>{item.label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-1 pt-4 border-t">
        <Link href="/settings">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
            <Settings className="w-5 h-5" />
            <span>설정</span>
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </Button>
      </div>
    </aside>
  )
}
