'use client'

import { useState } from 'react'
import { X, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: any) => void
  initialFilters?: any
}

export function FilterPanel({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}: FilterPanelProps) {
  const [tempFilters, setTempFilters] = useState(initialFilters || {})

  if (!isOpen) return null

  const handleApply = () => {
    onApply(tempFilters)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-navy">상세 필터</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
            {/* Severity Section */}
            <div>
                <h3 className="text-sm font-bold text-navy mb-4">처분 심각도</h3>
                <div className="grid grid-cols-2 gap-2">
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setTempFilters({ ...tempFilters, severity: s })}
                            className={cn(
                                "py-3 px-4 rounded-2xl text-xs font-bold transition-all border",
                                tempFilters.severity === s 
                                    ? "bg-navy text-white border-navy" 
                                    : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                            )}
                        >
                            {s === 'CRITICAL' ? '심각 (취소/폐쇄)' : 
                             s === 'HIGH' ? '높음 (2개월↑)' : 
                             s === 'MEDIUM' ? '보통 (정지/과징금)' : '낮음 (경고)'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Section */}
            <div>
                <h3 className="text-sm font-bold text-navy mb-4">카테고리</h3>
                <div className="flex flex-wrap gap-2">
                    {['치킨', '한식', '중식', '일식', '양식', '피자', '패스트푸드', '카페'].map((c) => (
                        <button
                            key={c}
                            onClick={() => setTempFilters({ ...tempFilters, category: c })}
                            className={cn(
                                "py-2 px-4 rounded-full text-xs font-bold transition-all border",
                                tempFilters.category === c 
                                    ? "bg-navy-tint text-navy border-navy/20" 
                                    : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                            )}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button 
                onClick={() => setTempFilters({})}
                className="flex-1 py-4 bg-white text-gray-500 rounded-2xl text-sm font-bold border border-gray-200"
            >
                초기화
            </button>
            <button 
                onClick={handleApply}
                className="flex-[2] py-4 bg-navy text-white rounded-2xl text-sm font-bold shadow-xl shadow-navy/20"
            >
                필터 적용하기
            </button>
        </div>
      </div>
    </div>
  )
}
