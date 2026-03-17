'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

export interface MapSanctionItem {
  id: string
  restaurantId: string
  restaurantName: string
  category: string
  severity: string
  violationContent: string
  dispositionDate: string
  lat: number
  lng: number
}

interface LeafletMapProps {
  center: [number, number]
  sanctions: MapSanctionItem[]
  userLocation: [number, number] | null
  onLocate: () => void
  isLocating: boolean
}

function getSeverityColor(severity: string): string {
  const s = severity.toUpperCase()
  if (s === 'CRITICAL' || s === 'HIGH') return '#ef4444'
  if (s === 'MEDIUM') return '#f97316'
  return '#22c55e'
}

export default function LeafletMap({
  center,
  sanctions,
  userLocation,
  onLocate,
  isLocating,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const userMarkerRef = useRef<import('leaflet').CircleMarker | null>(null)
  const markersRef = useRef<import('leaflet').Marker[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix default icon URLs (webpack/Next.js bundling bug)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current).setView(center, 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update center when it changes (after geolocation)
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom())
  }, [center])

  // Render sanction markers
  useEffect(() => {
    if (!mapInstanceRef.current) return

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current
      if (!map) return

      // Remove old markers
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      sanctions.forEach((item) => {
        const color = getSeverityColor(item.severity)
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width: 28px; height: 28px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -30],
        })

        const popup = `
          <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
            <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #0f172a;">
              ${item.restaurantName}
            </h3>
            <p style="margin: 0 0 6px; font-size: 11px; color: #64748b;">${item.category}</p>
            <div style="background: #fef2f2; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px;">
              <p style="margin: 0; font-size: 11px; color: #dc2626; font-weight: 600;">위반 내용</p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #374151;">${item.violationContent}</p>
            </div>
            <p style="margin: 0 0 8px; font-size: 11px; color: #6b7280;">처분일: ${item.dispositionDate}</p>
            <a href="/restaurant/${item.restaurantId}"
               style="display: block; text-align: center; background: #0f172a; color: white;
                      padding: 6px 12px; border-radius: 8px; font-size: 12px; text-decoration: none;
                      font-weight: 600;">
              상세 보기
            </a>
          </div>
        `

        const marker = L.marker([item.lat, item.lng], { icon })
          .bindPopup(popup)
          .addTo(map)

        markersRef.current.push(marker)
      })
    })
  }, [sanctions])

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current
      if (!map) return

      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }

      if (userLocation) {
        const marker = L.circleMarker(userLocation, {
          radius: 10,
          fillColor: '#3b82f6',
          color: 'white',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .bindPopup('<b>현재 위치</b>')
          .addTo(map)

        userMarkerRef.current = marker
        map.setView(userLocation, 15)
      }
    })
  }, [userLocation])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Geolocation button overlaid on map */}
      <button
        onClick={onLocate}
        className="absolute bottom-4 right-4 z-[1000] w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-navy hover:bg-gray-50 transition-colors"
        title="내 위치로 이동"
      >
        {isLocating ? (
          <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" />
          </svg>
        )}
      </button>
    </div>
  )
}
