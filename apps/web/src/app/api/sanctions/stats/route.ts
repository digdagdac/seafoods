import { NextResponse } from 'next/server'
import {
  fetchSanctions,
  deriveSeverity,
  deriveSanctionType,
  corsHeaders,
  PublicApiError,
} from '@/lib/public-api'

export const runtime = 'edge'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'configuration_error', message: 'API key is not configured' },
      { status: 503, headers: corsHeaders },
    )
  }

  try {
    // Fetch first page to get total_count, then fetch enough for stats aggregation
    const first = await fetchSanctions({ apiKey, start: 1, end: 1 })
    const totalCount = first.totalCount

    // Fetch up to 1000 recent rows for aggregation (cap to avoid timeout)
    const fetchSize = Math.min(totalCount, 1000)
    const { rows } = await fetchSanctions({ apiKey, start: 1, end: fetchSize })

    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}
    const byRegionMap: Record<string, number> = {}

    for (const row of rows) {
      // byType: derived from 처분유형코드명
      const typeKey = deriveSanctionType(row.DSPS_TYPECD_NM ?? '')
      byType[typeKey] = (byType[typeKey] ?? 0) + 1

      // bySeverity
      const sev = deriveSeverity(row.DSPS_TYPECD_NM ?? '', row.DSPSCN ?? '')
      bySeverity[sev] = (bySeverity[sev] ?? 0) + 1

      // byRegion: extract from ADDR
      const addrMatch = (row.ADDR ?? '').match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/)
      const regionName = addrMatch ? addrMatch[1] : '기타'
      byRegionMap[regionName] = (byRegionMap[regionName] ?? 0) + 1
    }

    const byRegion = Object.entries(byRegionMap)
      .map(([regionName, count]) => ({
        regionCode: regionName,
        regionName,
        count,
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json(
      {
        totalCount,
        byType,
        bySeverity,
        byRegion,
      },
      {
        headers: {
          ...corsHeaders,
          // Stats can be cached longer since they are aggregated
          'Cache-Control': 's-maxage=600, stale-while-revalidate=120',
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
