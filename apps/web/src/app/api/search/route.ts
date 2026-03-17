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

  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const region = (searchParams.get('region') ?? '').trim()
  const category = (searchParams.get('category') ?? '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') ?? '20', 10)))

  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'configuration_error', message: 'API key is not configured' },
      { status: 503, headers: corsHeaders },
    )
  }

  try {
    // 업소명 검색은 API에서 미지원 → 충분한 데이터를 가져와서 클라이언트 필터링
    // 날짜/인허가번호 필터만 서버에서 동작
    const batchSize = q ? 1000 : perPage
    const start = q ? 1 : (page - 1) * perPage + 1
    const end = q ? batchSize : start + perPage - 1

    const { rows, totalCount } = await fetchSanctions({ apiKey, start, end })

    let filtered = rows
    if (q) {
      filtered = rows.filter((row) => {
        const name = (row.PRCSCITYPOINT_BSSHNM ?? '').toLowerCase()
        const addr = (row.ADDR ?? '').toLowerCase()
        const industryType = (row.INDUTY_CD_NM ?? '').toLowerCase()
        return name.includes(q) || addr.includes(q) || industryType.includes(q)
      })
    }
    if (region) {
      filtered = filtered.filter((row) => (row.ADDR ?? '').includes(region))
    }
    if (category) {
      filtered = filtered.filter((row) => (row.INDUTY_CD_NM ?? '').includes(category))
    }

    // 클라이언트 필터링 후 페이지네이션
    const filteredTotal = filtered.length
    const offset = q ? (page - 1) * perPage : 0
    const paged = q ? filtered.slice(offset, offset + perPage) : filtered

    const items = paged.map((row, i) => mapRowToRestaurant(row, offset + i))

    return NextResponse.json(
      {
        items,
        total: q ? filteredTotal : totalCount,
        page,
        perPage,
        hasMore: q ? offset + perPage < filteredTotal : end < totalCount,
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
