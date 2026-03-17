import { NextRequest, NextResponse } from 'next/server'
import {
  fetchSanctions,
  mapRowToRestaurant,
  corsHeaders,
  cacheHeaders,
  PublicApiError,
} from '@/lib/public-api'
import type { RestaurantItem } from '@/lib/public-api'

export const runtime = 'edge'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius')

  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'configuration_error', message: 'API key is not configured' },
      { status: 503, headers: corsHeaders },
    )
  }

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'bad_request', message: 'lat and lng are required' },
      { status: 400, headers: corsHeaders },
    )
  }

  try {
    const result = await fetchSanctions({ apiKey, start: 1, end: 20 })

    const seen = new Set<string>()
    const items: RestaurantItem[] = []
    for (let i = 0; i < result.rows.length; i++) {
      const restaurant = mapRowToRestaurant(result.rows[i], i)
      if (!seen.has(restaurant.id)) {
        seen.add(restaurant.id)
        items.push(restaurant)
      }
    }

    return NextResponse.json(
      { items, hasMore: false },
      { headers: { ...corsHeaders, ...cacheHeaders } },
    )
  } catch (err) {
    if (err instanceof PublicApiError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 502, headers: corsHeaders },
      )
    }
    return NextResponse.json(
      { error: 'internal_error', message: 'Unexpected error' },
      { status: 500, headers: corsHeaders },
    )
  }
}
