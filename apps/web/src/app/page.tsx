import { Suspense } from 'react'
import { AlertTriangle, TrendingUp, MapPin, ChevronRight, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/ui/search-bar'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { SanctionSeverity, RestaurantStatus } from '@safedeliver/shared-types'

// ─── Mock data for SSR skeleton (real data fetched client-side) ───────────────

const MOCK_SUMMARY = {
  region: '서울특별시',
  totalThisMonth: 142,
  criticalCount: 8,
  highCount: 23,
  lastUpdated: '2024-03-15',
}

const MOCK_RECENT = [
  {
    id: '1',
    restaurantName: '맛있는 치킨',
    address: '서울 강남구 역삼동',
    type: '영업정지',
    severity: SanctionSeverity.HIGH,
    date: '2024-03-14',
    violation: '식품위생법 위반 - 유통기한 경과 식품 사용',
  },
  {
    id: '2',
    restaurantName: '행복한 분식',
    address: '서울 마포구 홍대입구',
    type: '시정명령',
    severity: SanctionSeverity.LOW,
    date: '2024-03-13',
    violation: '조리사 위생교육 미이수',
  },
  {
    id: '3',
    restaurantName: '신선한 해산물',
    address: '서울 송파구 잠실동',
    type: '영업취소',
    severity: SanctionSeverity.CRITICAL,
    date: '2024-03-12',
    violation: '반복 위생 위반 - 3회 이상 영업정지 이력',
  },
  {
    id: '4',
    restaurantName: '달콤한 베이커리',
    address: '서울 종로구 인사동',
    type: '과징금',
    severity: SanctionSeverity.MEDIUM,
    date: '2024-03-11',
    violation: '식품 표시기준 위반',
  },
]

const SEVERITY_BG: Record<SanctionSeverity, string> = {
  [SanctionSeverity.CRITICAL]: 'bg-red-50 border-red-100',
  [SanctionSeverity.HIGH]: 'bg-orange-50 border-orange-100',
  [SanctionSeverity.MEDIUM]: 'bg-amber-50 border-amber-100',
  [SanctionSeverity.LOW]: 'bg-blue-50 border-blue-100',
}

const SEVERITY_BORDER_L: Record<SanctionSeverity, string> = {
  [SanctionSeverity.CRITICAL]: 'border-l-severity-critical',
  [SanctionSeverity.HIGH]: 'border-l-severity-high',
  [SanctionSeverity.MEDIUM]: 'border-l-severity-medium',
  [SanctionSeverity.LOW]: 'border-l-severity-low',
}

export default function HomePage() {
  return (
    <>
      <Header showNotification />

      {/* Hero search section */}
      <section
        className="bg-navy px-4 pt-4 pb-8"
        aria-label="음식점 검색"
      >
        <div className="mb-4">
          <h2 className="text-xl font-black text-white leading-snug mb-1 text-balance">
            안전한 배달 음식을<br />
            <span className="text-navy-tint">직접 확인</span>하세요
          </h2>
          <p className="text-sm text-white/60">
            전국 음식점 행정처분 이력을 실시간으로 제공합니다
          </p>
        </div>
        <SearchBar size="lg" />
      </section>

      <div className="px-4 -mt-4 space-y-5 animate-slide-up">

        {/* Regional summary card */}
        <section aria-labelledby="region-summary-heading">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-navy" aria-hidden="true" />
                <h2
                  id="region-summary-heading"
                  className="section-title"
                >
                  내 주변 행정처분 현황
                </h2>
              </div>
              <span className="text-xs text-gray-400">{MOCK_SUMMARY.region}</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-navy-light rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-navy leading-none">
                  {MOCK_SUMMARY.totalThisMonth}
                </p>
                <p className="text-2xs text-gray-500 mt-1">이번달 처분</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-severity-critical leading-none">
                  {MOCK_SUMMARY.criticalCount}
                </p>
                <p className="text-2xs text-gray-500 mt-1">심각</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-severity-high leading-none">
                  {MOCK_SUMMARY.highCount}
                </p>
                <p className="text-2xs text-gray-500 mt-1">높음</p>
              </div>
            </div>

            <Link
              href="/map"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-navy-tint text-navy text-sm font-semibold hover:bg-navy/10 transition-colors duration-150 focus-ring"
            >
              <MapPin className="w-4 h-4" aria-hidden="true" />
              지도에서 보기
            </Link>
          </div>
        </section>

        {/* Severity legend */}
        <section aria-labelledby="severity-legend-heading">
          <h2 id="severity-legend-heading" className="section-title mb-3">
            처분 심각도 안내
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { severity: SanctionSeverity.CRITICAL, desc: '영업취소·폐쇄명령' },
              { severity: SanctionSeverity.HIGH, desc: '영업정지 2개월 이상' },
              { severity: SanctionSeverity.MEDIUM, desc: '영업정지·과징금' },
              { severity: SanctionSeverity.LOW, desc: '시정명령·경고' },
            ].map(({ severity, desc }) => (
              <div
                key={severity}
                className={`flex items-center gap-2.5 p-3 rounded-xl border ${SEVERITY_BG[severity]}`}
              >
                <SeverityBadge severity={severity} variant="compact" />
                <span className="text-2xs text-gray-600 leading-tight">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent sanctions feed */}
        <section aria-labelledby="recent-sanctions-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="recent-sanctions-heading" className="section-title flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              최근 행정처분
            </h2>
            <Link
              href="/search?hasSanction=true"
              className="text-xs text-navy font-medium flex items-center gap-0.5 focus-ring rounded"
              aria-label="전체 행정처분 보기"
            >
              전체보기
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <ul role="list" className="space-y-3" aria-label="최근 행정처분 목록">
            {MOCK_RECENT.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/restaurant/${item.id}`}
                  className="block card border-l-4 p-4 hover:shadow-card-hover transition-shadow duration-150 focus-ring"
                  style={{}}
                  aria-label={`${item.restaurantName} ${item.type} 처분 상세 보기`}
                >
                  <article className={`border-l-4 -ml-4 pl-4 rounded-none ${SEVERITY_BORDER_L[item.severity]}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <SeverityBadge severity={item.severity} variant="compact" />
                        <span className="text-xs text-gray-500">{item.type}</span>
                      </div>
                      <time
                        className="text-2xs text-gray-400 flex-shrink-0"
                        dateTime={item.date}
                      >
                        {item.date}
                      </time>
                    </div>
                    <h3 className="text-sm font-bold text-navy mb-0.5 line-clamp-1">
                      {item.restaurantName}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-1.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                      {item.address}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {item.violation}
                    </p>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Safety notice */}
        <section>
          <div className="flex items-start gap-3 p-4 bg-navy-tint rounded-2xl border border-navy/10 mb-2">
            <ShieldAlert className="w-5 h-5 text-navy flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-navy mb-0.5">데이터 출처 안내</p>
              <p className="text-xs text-navy/70 leading-relaxed">
                본 서비스의 행정처분 정보는 식품의약품안전처 및 각 지자체의
                공개 데이터를 기반으로 합니다. 처분 이후 상황은 다를 수 있습니다.
              </p>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
