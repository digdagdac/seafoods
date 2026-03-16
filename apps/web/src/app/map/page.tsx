'use client'

import { useState, useEffect } from 'react'
import { Map as MapIcon, Navigation, Search, Filter, List, GpsFixed, Loader2, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useNearbyRestaurants } from '@/hooks/use-restaurants'
import { RestaurantDto, RestaurantStatus } from '@safedeliver/shared-types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function MapPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    // Default to Seoul if geolocation fails or is not supported
    setCoords({ lat: 37.5665, lng: 126.9780 })
    
    if (navigator.geolocation) {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setIsLocating(false)
        },
        () => {
          setIsLocating(false)
        }
      )
    }
  }, [])

  const { data, isLoading } = useNearbyRestaurants(
    coords ? { lat: coords.lat, lng: coords.lng, radius: 2000 } : { lat: 0, lng: 0, radius: 0 }
  )

  const restaurants = data?.pages.flatMap(page => (page as any).restaurants as RestaurantDto[]) ?? []

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header showBack title="주변 탐색" />

      {/* Map Area (Placeholder) */}
      <div className="relative flex-1 bg-slate-200 overflow-hidden">
        {/* Mock Map Background */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
                <MapIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">지도를 불러오는 중입니다...</p>
                <p className="text-slate-400 text-xs mt-1">네이버/카카오맵 API 연동 예정</p>
            </div>
        </div>

        {/* Mock Pins */}
        {restaurants.slice(0, 10).map((r, i) => (
            <div 
                key={r.id}
                className="absolute transform -translate-x-1/2 -translate-y-full"
                style={{ 
                    left: `${40 + (i * 15) % 30}%`, 
                    top: `${30 + (i * 20) % 50}%` 
                }}
            >
                <div className={cn(
                    "flex flex-col items-center",
                    r.totalSanctions > 0 ? "text-severity-high" : "text-navy"
                )}>
                    <div className="bg-white px-2 py-1 rounded-full shadow-md border border-gray-100 text-[10px] font-bold mb-1 whitespace-nowrap">
                        {r.name}
                    </div>
                    <MapIcon className="w-6 h-6 fill-current" />
                </div>
            </div>
        ))}

        {/* User Location Pin */}
        {coords && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25" />
                    <div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
                </div>
            </div>
        )}

        {/* Floating Controls */}
        <div className="absolute bottom-6 left-4 right-4 flex flex-col gap-3">
            <div className="flex justify-end">
                <button 
                    onClick={() => {/* geolocation trigger */}}
                    className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-navy focus-ring"
                >
                    <GpsFixed className={cn("w-6 h-6", isLocating && "animate-pulse")} />
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-4 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-navy">
                        주변 {restaurants.length}개의 음식점
                    </h2>
                    <button 
                        onClick={() => setShowList(!showList)}
                        className="text-xs text-navy font-medium flex items-center gap-1"
                    >
                        {showList ? '지도 숨기기' : '목록 전체보기'}
                    </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {isLoading ? (
                        [1,2,3].map(i => <div key={i} className="min-w-[200px] h-24 bg-gray-100 rounded-2xl animate-pulse" />)
                    ) : (
                        restaurants.slice(0, 5).map(r => (
                            <Link 
                                key={r.id} 
                                href={`/restaurant/${r.id}`}
                                className="min-w-[240px] bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        {r.totalSanctions > 0 && <AlertTriangle className="w-3 h-3 text-severity-high" />}
                                        <h3 className="text-sm font-bold text-navy truncate">{r.name}</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mb-2">{r.roadAddress}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                            {r.category}
                                        </span>
                                        {r.totalSanctions > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold">
                                                처분 {r.totalSanctions}건
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
