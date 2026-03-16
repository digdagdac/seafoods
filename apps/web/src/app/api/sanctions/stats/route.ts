import { NextResponse } from 'next/server'
import {
  fetchI2715,
  deriveSeverity,
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
    const first = await fetchI2715({ apiKey, start: 1, end: 1 })
    const totalCount = first.totalCount

    // Fetch up to 1000 recent rows for aggregation (cap to avoid timeout)
    const fetchSize = Math.min(totalCount, 1000)
    const { rows } = await fetchI2715({ apiKey, start: 1, end: fetchSize })

    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}
    const byRegionMap: Record<string, number> = {}

    for (const row of rows) {
      // byType: keyed on 처분내용 first word (e.g. "영업정지", "과태료", "시정명령")
      const typeKey = extractDispositionType(row.DSPN_CN)
      byType[typeKey] = (byType[typeKey] ?? 0) + 1

      // bySeverity
      const sev = deriveSeverity(row.DSPN_CN ?? '')
      bySeverity[sev] = (bySeverity[sev] ?? 0) + 1

      // byRegion
      const regionName = row.AREA_NM ?? '기타'
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

function extractDispositionType(dspnCn: string): string {
  if (!dspnCn) return '기타'
  const keywords = ['영업정지', '영업취소', '폐쇄명령', '과태료', '시정명령', '경고', '허가취소']
  for (const kw of keywords) {
    if (dspnCn.includes(kw)) return kw
  }
  return dspnCn.split(' ')[0] ?? '기타'
}
