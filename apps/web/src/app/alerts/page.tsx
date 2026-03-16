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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                <Bell className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-1">새로운 알림이 없습니다</h3>
            <p className="text-sm text-gray-400">
                음식점 처분 소식을 가장 먼저 알려드릴게요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">최근 30일간의 알림입니다</span>
                <button className="text-xs text-navy font-medium">모두 읽음으로 표시</button>
            </div>

            {alerts.map((alert) => (
              <div 
                key={alert.id}
                onClick={() => !alert.isRead && markAsRead.mutate(alert.id)}
                className={cn(
                    "card p-4 transition-all duration-150 cursor-pointer",
                    alert.isRead ? "bg-white opacity-70" : "bg-white border-l-4 border-l-navy shadow-md"
                )}
              >
                <div className="flex gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        alert.type.includes('SANCTION') ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                    )}>
                        {alert.type.includes('SANCTION') ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-bold text-navy truncate">{alert.title}</h3>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                {formatRelativeTime(alert.createdAt)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {alert.content}
                        </p>
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
