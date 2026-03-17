'use client'

import { Bell, Check, Loader2, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useAlerts, useMarkAlertAsRead } from '@/hooks/use-alerts'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts()
  const markAsRead = useMarkAlertAsRead()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header showBack title="알림" />

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-navy/20 mb-4" />
            <p className="text-gray-400 text-sm">알림을 불러오는 중...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center shadow-xl shadow-navy/5 border border-navy/5 relative z-10">
                  <Bell className="w-10 h-10 text-gray-200" />
              </div>
              <div className="absolute inset-0 bg-navy/5 rounded-[2.5rem] rotate-6 -z-0" />
            </div>
            <h3 className="text-xl font-black text-navy mb-2">새로운 알림이 없습니다</h3>
            <p className="text-sm text-gray-400 font-medium max-w-[200px] leading-relaxed">
                주변 음식점의 행정처분 소식을<br/>가장 먼저 알려드릴게요
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-24 max-w-screen-md mx-auto">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Recent 30 Days</span>
                <button 
                  className="text-xs font-black text-navy hover:text-accent transition-colors uppercase tracking-widest"
                  onClick={() => {/* Mark all as read logic */}}
                >
                  Mark all as read
                </button>
            </div>

            {alerts.map((alert) => (
              <div 
                key={alert.id}
                onClick={() => !alert.isRead && markAsRead.mutate(alert.id)}
                className={cn(
                    "card p-5 transition-all duration-300 cursor-pointer relative overflow-hidden group",
                    alert.isRead 
                      ? "bg-white/60 border-transparent shadow-none" 
                      : "bg-white border-navy/5 shadow-md shadow-navy/5 active:scale-[0.98]"
                )}
              >
                {!alert.isRead && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-navy" />
                )}
                
                <div className="flex gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110",
                        alert.type.includes('SANCTION') 
                          ? "bg-red-50 text-red-500 border border-red-100" 
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    )}>
                        {alert.type.includes('SANCTION') ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <h3 className={cn(
                              "text-base font-black truncate leading-tight",
                              alert.isRead ? "text-gray-400" : "text-navy"
                            )}>
                              {alert.title}
                            </h3>
                            <span className="text-[10px] font-bold text-gray-300 whitespace-nowrap ml-2 uppercase tracking-tighter">
                                {formatRelativeTime(alert.createdAt)}
                            </span>
                        </div>
                        <p className={cn(
                          "text-sm font-medium line-clamp-2 leading-relaxed",
                          alert.isRead ? "text-gray-300" : "text-gray-500"
                        )}>
                            {alert.content}
                        </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-colors",
                        alert.isRead ? "text-gray-200" : "text-gray-300"
                      )} />
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
