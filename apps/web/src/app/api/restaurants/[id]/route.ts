import { NextRequest, NextResponse } from 'next/server'
import {
  fetchSanctions,
  mapRowToRestaurant,
  mapRowToSanction,
  corsHeaders,
  cacheHeaders,
  PublicApiError,
} from '@/lib/public-api'


export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params

  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'configuration_error', message: 'API key is not configured' },
      { status: 503, headers: corsHeaders },
    )
  }

  if (!id) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Restaurant id is required' },
      { status: 400, headers: corsHeaders },
    )
  }

  try {
    // id may be a business licence number (LCNS_NO) or a URL-encoded name (PRCSCITYPOINT_BSSHNM).
    // Try LCNS_NO first; fall back to name search.
    let rows = await fetchSanctions({
      apiKey,
      start: 1,
      end: 50,
      params: { LCNS_NO: id },
    }).then((r) => r.rows)

    if (rows.length === 0) {
      // Try interpreting id as a decoded restaurant name
      const name = decodeURIComponent(id)
      rows = await fetchSanctions({
        apiKey,
        start: 1,
        end: 50,
        params: { PRCSCITYPOINT_BSSHNM: name },
      }).then((r) => r.rows)
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'not_found', message: '해당 업소를 찾을 수 없습니다' },
        { status: 404, headers: corsHeaders },
      )
    }

    // Use the first row as the canonical restaurant record
    const restaurant = mapRowToRestaurant(rows[0], 0)
    // All rows for this restaurant are its sanctions
    const sanctions = rows.map((row, i) => mapRowToSanction(row, i))

    return NextResponse.json(
      { restaurant, sanctions },
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
