'use client'

import { User, Bookmark, Bell, Settings, LogOut, ChevronRight, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useMe } from '@/hooks/use-auth'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function MyPage() {
  const { data: user, isLoading: isUserLoading } = useMe()
  const { data: bookmarks = [], isLoading: isBookmarksLoading } = useBookmarks()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="마이페이지" />

      <div className="px-4 pt-6 space-y-6">
        {/* Profile Section */}
        <section className="card p-5">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center border border-navy/10">
                    <User className="w-8 h-8 text-navy" />
                </div>
                <div className="flex-1">
                    {isUserLoading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-5 w-24 bg-gray-100 rounded" />
                            <div className="h-4 w-32 bg-gray-50 rounded" />
                        </div>
                    ) : user ? (
                        <>
                            <h2 className="text-lg font-bold text-navy">{user.name}</h2>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-lg font-bold text-navy">로그인이 필요합니다</h2>
                            <Link href="/auth/login" className="text-sm text-navy-tint font-medium">로그인하고 혜택 받기</Link>
                        </>
                    )}
                </div>
                <button className="p-2 text-gray-400 hover:text-navy transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </section>

        {/* Bookmark Section */}
        <section>
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="section-title flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4" />
                    즐겨찾는 음식점
                </h3>
                <span className="text-xs text-gray-400 font-medium">{bookmarks.length}곳</span>
            </div>

            {isBookmarksLoading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="card h-20 animate-pulse" />)}
                </div>
            ) : bookmarks.length === 0 ? (
                <div className="card p-8 text-center bg-white/50 border-dashed border-2">
                    <Bookmark className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">즐겨찾는 음식점이 없습니다</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bookmarks.map(r => (
                        <Link 
                            key={r.id}
                            href={`/restaurant/${r.id}`}
                            className="block card p-4 hover:shadow-card-hover transition-shadow duration-150"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-navy truncate mb-1">{r.name}</h4>
                                    <p className="text-xs text-gray-500 truncate mb-2">{r.roadAddress}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                            {r.category}
                                        </span>
                                        {r.totalSanctions > 0 ? (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold">
                                                처분 {r.totalSanctions}건
                                            </span>
                                        ) : (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">
                                                청결 업체
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>

        {/* Subscription & Settings Menu */}
        <section className="space-y-3">
            <h3 className="section-title px-1">활동 및 설정</h3>
            <div className="card overflow-hidden">
                {[
                    { icon: Bell, label: '알림 설정', href: '/alerts/settings' },
                    { icon: ShieldCheck, label: '데이터 제보하기', href: '/report' },
                    { icon: Settings, label: '서비스 이용약관', href: '/terms' },
                ].map((item, idx, arr) => (
                    <Link 
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
                            idx !== arr.length - 1 && "border-b border-gray-100"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                ))}
            </div>
        </section>

        {/* Logout Button */}
        {user && (
            <button className="flex items-center justify-center gap-2 w-full py-4 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
                로그아웃
            </button>
        )}

        <div className="text-center py-6">
            <p className="text-[10px] text-gray-300">Safe Deliver v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
