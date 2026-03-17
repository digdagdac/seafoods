import { NextRequest, NextResponse } from 'next/server'
import {
  fetchSanctions,
  mapRowToRestaurant,
  corsHeaders,
  cacheHeaders,
  PublicApiError,
} from '@/lib/public-api'

export const runtime = 'edge'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const q = searchParams.get('q') ?? ''
  const region = searchParams.get('region') ?? ''
  const category = searchParams.get('category') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') ?? '20', 10)))

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
  if (q) params['PRCSCITYPOINT_BSSHNM'] = q
  if (category) params['INDUTY_CD_NM'] = category

  try {
    const { rows, totalCount } = await fetchSanctions({ apiKey, start, end, params })

    const items = rows.map((row, i) => mapRowToRestaurant(row, start + i - 1))

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
