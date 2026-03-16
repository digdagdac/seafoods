import { Suspense } from 'react'
import { AlertTriangle, TrendingUp, MapPin, ChevronRight, ShieldAlert, Info } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/ui/search-bar'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { PageContainer } from '@/components/layout/page-container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SanctionSeverity } from '@safedeliver/shared-types'
import { cn } from '@/lib/utils'

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
  [SanctionSeverity.CRITICAL]: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30',
  [SanctionSeverity.HIGH]: 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30',
  [SanctionSeverity.MEDIUM]: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30',
  [SanctionSeverity.LOW]: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30',
}

const SEVERITY_BORDER_L: Record<SanctionSeverity, string> = {
  [SanctionSeverity.CRITICAL]: 'border-l-severity-critical',
  [SanctionSeverity.HIGH]: 'border-l-severity-high',
  [SanctionSeverity.MEDIUM]: 'border-l-severity-medium',
  [SanctionSeverity.LOW]: 'border-l-severity-low',
}

export default function HomePage() {
  return (
    <PageContainer noPadding className="bg-background">
      <Header showNotification />

      {/* Hero search section */}
      <section
        className="bg-navy dark:bg-navy-dark px-4 pt-6 pb-12 sm:pt-12 sm:pb-20 sm:px-8 relative overflow-hidden"
        aria-label="음식점 검색"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 blur-3xl rounded-full -ml-20 -mb-20 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 text-balance">
              안전한 배달 음식을<br />
              <span className="text-teal underline underline-offset-8">직접 확인</span>하세요
            </h2>
            <p className="text-base sm:text-lg text-white/60 max-w-xl">
              식품의약품안전처 데이터를 기반으로 전국 음식점의 행정처분 이력을 실시간으로 제공합니다.
            </p>
          </div>
          <SearchBar size="lg" className="max-w-2xl" />
        </div>
      </section>

      <div className="px-4 sm:px-8 -mt-6 sm:-mt-10 pb-12 space-y-8 sm:space-y-12 max-w-6xl mx-auto">

        {/* Regional summary card */}
        <section aria-labelledby="region-summary-heading">
          <Card className="shadow-soft-xl border-none">
            <CardContent className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="region-summary-heading" className="text-lg sm:text-xl font-bold">
                      내 주변 행정처분 현황
                    </h2>
                    <p className="text-sm text-muted-foreground">{MOCK_SUMMARY.region} 기준</p>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit self-start sm:self-center">
                  최근 업데이트: {MOCK_SUMMARY.lastUpdated}
                </Badge>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/50 rounded-2xl p-5 flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                  <p className="text-3xl font-black text-primary leading-none mb-2">
                    {MOCK_SUMMARY.totalThisMonth}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">이번달 처분</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-5 flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                  <p className="text-3xl font-black text-severity-critical leading-none mb-2">
                    {MOCK_SUMMARY.criticalCount}
                  </p>
                  <p className="text-xs font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-widest">심각 처분</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-5 flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                  <p className="text-3xl font-black text-severity-high leading-none mb-2">
                    {MOCK_SUMMARY.highCount}
                  </p>
                  <p className="text-xs font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest">높음 심각도</p>
                </div>
              </div>

              <Link href="/map" className="block">
                <Button className="w-full h-12 rounded-2xl text-base font-bold gap-2">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                  실시간 위반 지도 보기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Severity legend */}
        <section aria-labelledby="severity-legend-heading">
          <div className="flex items-center gap-2 mb-5">
            <Info className="w-5 h-5 text-primary" />
            <h2 id="severity-legend-heading" className="text-lg sm:text-xl font-bold">
              처분 심각도 안내
            </h2>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { severity: SanctionSeverity.CRITICAL, desc: '영업취소·폐쇄명령' },
              { severity: SanctionSeverity.HIGH, desc: '영업정지 2개월 이상' },
              { severity: SanctionSeverity.MEDIUM, desc: '영업정지·과징금' },
              { severity: SanctionSeverity.LOW, desc: '시정명령·경고' },
            ].map(({ severity, desc }) => (
              <Card key={severity} className={cn("border-none", SEVERITY_BG[severity])}>
                <CardContent className="p-4 flex items-center gap-4">
                  <SeverityBadge severity={severity} variant="compact" />
                  <span className="text-xs font-bold text-foreground/70 leading-tight">{desc}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent sanctions feed */}
        <section aria-labelledby="recent-sanctions-heading">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-secondary" aria-hidden="true" />
              </div>
              <h2 id="recent-sanctions-heading" className="text-lg sm:text-xl font-bold">
                최근 행정처분
              </h2>
            </div>
            <Link href="/search?hasSanction=true">
              <Button variant="ghost" className="gap-1 font-bold">
                전체보기
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_RECENT.map((item) => (
              <Link
                key={item.id}
                href={`/restaurant/${item.id}`}
                className="group focus-ring rounded-2xl block"
              >
                <Card hover className={cn("border-l-4 h-full", SEVERITY_BORDER_L[item.severity])}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={item.severity} variant="compact" />
                        <Badge variant="outline" className="text-[10px] uppercase">{item.type}</Badge>
                      </div>
                      <time className="text-[10px] font-bold text-muted-foreground" dateTime={item.date}>
                        {item.date}
                      </time>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors truncate">
                      {item.restaurantName}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </p>
                    <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed italic">
                      "{item.violation}"
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Safety notice */}
        <section>
          <Card className="bg-primary/5 dark:bg-primary/10 border-none rounded-3xl overflow-hidden">
            <CardContent className="p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <ShieldAlert className="w-10 h-10 text-primary" aria-hidden="true" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold text-primary mb-2">데이터 신뢰성 및 출처 안내</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  SafeDeliver의 모든 행정처분 정보는 식품의약품안전처 및 각 지자체의
                  공식 공공데이터 포털을 통해 수집됩니다. 처분 이후 시정 조치 등으로 인해 실제
                  현장 상황은 데이터와 다를 수 있으니 참고용으로만 활용해 주시기 바랍니다.
                </p>
                <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge variant="secondary">식품의약품안전처</Badge>
                  <Badge variant="secondary">지방자치단체 공공데이터</Badge>
                  <Badge variant="secondary">실시간 연동</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </PageContainer>
  )
}
