'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useNearbyRestaurants } from '@/hooks/use-restaurants'
import { RestaurantDto } from '@safedeliver/shared-types'
import Link from 'next/link'
import { getRecentSanctions, SanctionItem } from '@/lib/api'
import type { MapSanctionItem } from '@/components/map/leaflet-map'

// Dynamic import with ssr: false to avoid Leaflet SSR issues
const LeafletMap = dynamic(() => import('@/components/map/leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">지도를 불러오는 중...</p>
      </div>
    </div>
  ),
})

// Seoul bounding box for random demo positions
const SEOUL_BOUNDS = {
  latMin: 37.45,
  latMax: 37.68,
  lngMin: 126.80,
  lngMax: 127.18,
}

function randomInRange(min: number, max: number, seed: number): number {
  // Deterministic pseudo-random based on seed so positions don't shift on re-render
  const x = Math.sin(seed) * 10000
  return min + (x - Math.floor(x)) * (max - min)
}

function sanctionToMapItem(item: SanctionItem, index: number): MapSanctionItem {
  return {
    id: item.id,
    restaurantId: item.restaurant.id,
    restaurantName: item.restaurant.name,
    category: item.restaurant.category,
    severity: item.severity,
    violationContent: item.violationContent,
    dispositionDate: item.dispositionDate,
    lat: randomInRange(SEOUL_BOUNDS.latMin, SEOUL_BOUNDS.latMax, index * 3.7 + 1.1),
    lng: randomInRange(SEOUL_BOUNDS.lngMin, SEOUL_BOUNDS.lngMax, index * 2.3 + 0.7),
  }
}

export default function MapPage() {
  const [center, setCenter] = useState<[number, number]>([37.5665, 126.9780])
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [sanctions, setSanctions] = useState<SanctionItem[]>([])

  // Fetch sanctions for map markers
  useEffect(() => {
    getRecentSanctions({ limit: 50 }).then(({ items }) => {
      setSanctions(items)
    }).catch(() => {
      // Silently fail; map still shows without markers
    })
  }, [])

  const mapSanctions = useMemo<MapSanctionItem[]>(
    () => sanctions.map((s, i) => sanctionToMapItem(s, i)),
    [sanctions]
  )

  // Coords for nearby restaurants query (use center as fallback)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 37.5665, lng: 126.9780 })

  const handleLocate = () => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude]
        setUserLocation(loc)
        setCenter(loc)
        setCoords({ lat: loc[0], lng: loc[1] })
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
      }
    )
  }

  const { data, isLoading } = useNearbyRestaurants({ lat: coords.lat, lng: coords.lng, radius: 2000 })
  const restaurants = data?.pages.flatMap(page => (page as any).items as RestaurantDto[]) ?? []

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header showBack title="주변 탐색" />

      {/* Map Area */}
      <div className="relative flex-1 overflow-hidden">
        <LeafletMap
          center={center}
          sanctions={mapSanctions}
          userLocation={userLocation}
          onLocate={handleLocate}
          isLocating={isLocating}
        />

        {/* Bottom Panel */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] px-4 pb-4">
          <div className="bg-white rounded-3xl shadow-xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-navy">
                주변 {restaurants.length}개의 음식점
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="min-w-[200px] h-24 bg-gray-100 rounded-2xl animate-pulse" />
                ))
              ) : restaurants.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 w-full text-center">주변 음식점 정보가 없습니다.</p>
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
