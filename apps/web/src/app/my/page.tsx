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

      <div className="px-4 pt-8 space-y-8 max-w-screen-md mx-auto">
        {/* Profile Section */}
        <section className="card p-6 border-navy/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-navy/5 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center gap-5 relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-navy/5 flex items-center justify-center border border-navy/5">
                    <User className="w-10 h-10 text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                    {isUserLoading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-6 w-32 bg-gray-100 rounded" />
                            <div className="h-4 w-48 bg-gray-50 rounded" />
                        </div>
                    ) : user ? (
                        <>
                            <h2 className="text-xl font-black text-navy truncate mb-1">{user.name}</h2>
                            <p className="text-sm font-medium text-gray-400 truncate">{user.email}</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-black text-navy mb-1">로그인이 필요합니다</h2>
                            <Link href="/auth/login" className="text-sm text-accent font-black uppercase tracking-wider">Join Now</Link>
                        </>
                    )}
                </div>
                <button className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-navy hover:bg-navy-tint transition-all duration-200">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </section>

        {/* Bookmark Section */}
        <section>
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="section-title flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    즐겨찾는 음식점
                </h3>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{bookmarks.length} saved</span>
            </div>

            {isBookmarksLoading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="card h-24 animate-pulse" />)}
                </div>
            ) : bookmarks.length === 0 ? (
                <div className="card p-12 text-center border-dashed border-2 bg-gray-50/50">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Bookmark className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-base font-black text-gray-700 mb-1">즐겨찾는 음식점이 없습니다</p>
                    <p className="text-sm text-gray-400 font-medium">관심 있는 음식점을 추가해 보세요.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookmarks.map(r => (
                        <Link 
                            key={r.id}
                            href={`/restaurant/${r.id}`}
                            className="block card p-5 hover:shadow-card-hover transition-all duration-200 active:scale-[0.98] border-navy/5 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-base font-black text-navy truncate mb-1">{r.name}</h4>
                                    <p className="text-sm font-medium text-gray-500 truncate mb-3">{r.roadAddress}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-tighter">
                                            {r.category}
                                        </span>
                                        {r.totalSanctions > 0 ? (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500 text-white uppercase tracking-tighter">
                                                SANCTION {r.totalSanctions}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500 text-white uppercase tracking-tighter">
                                                CLEAN
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>

        {/* Subscription & Settings Menu */}
        <section className="space-y-4 pb-12">
            <h3 className="section-title px-1">활동 및 설정</h3>
            <div className="card overflow-hidden border-navy/5 shadow-sm">
                {[
                    { icon: Bell, label: '알림 설정', href: '/alerts/settings' },
                    { icon: ShieldCheck, label: '데이터 제보하기', href: '/report' },
                    { icon: Settings, label: '서비스 이용약관', href: '/terms' },
                ].map((item, idx, arr) => (
                    <Link 
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors group min-h-[64px]",
                            idx !== arr.length - 1 && "border-b border-gray-100"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-navy-tint transition-colors">
                                <item.icon className="w-5 h-5 text-gray-400 group-hover:text-navy" />
                            </div>
                            <span className="text-base font-bold text-gray-700">{item.label}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
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
