'use client'

import { Bell, Loader2, AlertTriangle, ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useAlerts } from '@/hooks/use-alerts'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { SanctionItem } from '@/lib/api'

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
}

const CARD_LEFT_BORDER: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-400',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-green-500',
}

const ICON_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-500 border-red-100',
  HIGH: 'bg-orange-50 text-orange-500 border-orange-100',
  MEDIUM: 'bg-yellow-50 text-yellow-500 border-yellow-100',
  LOW: 'bg-green-50 text-green-600 border-green-100',
}

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: '심각',
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
}

function SanctionCard({ sanction }: { sanction: SanctionItem }) {
  const severity = sanction.severity ?? 'MEDIUM'
  const iconStyle = ICON_STYLES[severity] ?? ICON_STYLES.MEDIUM
  const leftBorder = CARD_LEFT_BORDER[severity] ?? CARD_LEFT_BORDER.MEDIUM
  const badgeStyle = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.MEDIUM
  const label = SEVERITY_LABEL[severity] ?? severity

  return (
    <Link
      href={`/restaurant/${sanction.restaurant.id}`}
      className="card p-5 transition-all duration-300 cursor-pointer relative overflow-hidden group bg-white border-navy/5 shadow-md shadow-navy/5 active:scale-[0.98] block"
    >
      <div className={cn('absolute top-0 left-0 w-1.5 h-full', leftBorder)} />

      <div className="flex gap-4">
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110 border',
          iconStyle,
        )}>
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-black truncate leading-tight text-navy">
              {sanction.restaurant.name}
            </h3>
            <span className="text-[10px] font-bold text-gray-300 whitespace-nowrap ml-2 uppercase tracking-tighter">
              {formatRelativeTime(sanction.dispositionDate)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-gray-400">{sanction.sanctionType}</span>
            <span className={cn(
              'text-[10px] font-black px-1.5 py-0.5 rounded-full border',
              badgeStyle,
            )}>
              {label}
            </span>
          </div>

          <p className="text-sm font-medium line-clamp-2 leading-relaxed text-gray-500">
            {sanction.violationContent}
          </p>
        </div>

        <div className="flex items-center justify-center">
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>
    </Link>
  )
}

export default function AlertsPage() {
  const { data, isLoading } = useAlerts()
  const sanctions = (data?.items ?? []).slice().sort(
    (a, b) => new Date(b.dispositionDate).getTime() - new Date(a.dispositionDate).getTime(),
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header showBack title="알림" />

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-navy/20 mb-4" />
            <p className="text-gray-400 text-sm">알림을 불러오는 중...</p>
          </div>
        ) : sanctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center shadow-xl shadow-navy/5 border border-navy/5 relative z-10">
                <Bell className="w-10 h-10 text-gray-200" />
              </div>
              <div className="absolute inset-0 bg-navy/5 rounded-[2.5rem] rotate-6 -z-0" />
            </div>
            <h3 className="text-xl font-black text-navy mb-2">최근 행정처분 알림이 없습니다</h3>
            <p className="text-sm text-gray-400 font-medium max-w-[200px] leading-relaxed">
              주변 음식점의 행정처분 소식을<br />가장 먼저 알려드릴게요
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-24 max-w-screen-md mx-auto">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Recent Sanctions
              </span>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                {sanctions.length}건
              </span>
            </div>

            {sanctions.map((sanction) => (
              <SanctionCard key={sanction.id} sanction={sanction} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
