import { NextRequest, NextResponse } from 'next/server'
import {
  fetchSanctions,
  mapRowToSanction,
  corsHeaders,
  cacheHeaders,
  PublicApiError,
} from '@/lib/public-api'


export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') ?? '20', 10)))
  const region = searchParams.get('region') ?? ''
  const restaurantId = searchParams.get('restaurantId') ?? ''

  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'configuration_error', message: 'API key is not configured' },
      { status: 503, headers: corsHeaders },
    )
  }

  const start = (page - 1) * perPage + 1
  const end = start + perPage - 1

  const params: Record<string, string> = {}
  // When filtering by restaurantId, we use LCNS_NO (인허가번호) field
  if (restaurantId) params['LCNS_NO'] = restaurantId

  try {
    const { rows, totalCount } = await fetchSanctions({ apiKey, start, end, params })

    // Rows from the API come sorted by date desc by default; maintain that order
    const items = rows.map((row, i) => mapRowToSanction(row, start + i - 1))

    return NextResponse.json(
      {
        items,
        total: totalCount,
        page,
        perPage,
        hasMore: end < totalCount,
      },
      {
        headers: {
          ...corsHeaders,
          ...cacheHeaders,
        },
      },
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
