import { notFound } from 'next/navigation'
import {
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
  Info,
  History,
  TrendingDown,
  ChevronRight,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { SanctionTimelineItem } from '@/components/ui/sanction-card'
import { PageContainer } from '@/components/layout/page-container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatKoreanDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  SanctionSeverity,
  SanctionType,
  RestaurantStatus,
  type RestaurantDto,
  type SanctionDto,
} from '@safedeliver/shared-types'
import type { Metadata } from 'next'

// ─── Mock data (replace with real fetch) ─────────────────────────────────────

const MOCK_RESTAURANTS: Record<string, RestaurantDto> = {
  '1': {
    id: '1',
    name: '맛있는 치킨',
    normalizedName: '맛있는치킨',
    category: '치킨',
    roadAddress: '서울특별시 강남구 역삼동 123-45',
    jibunAddress: '서울특별시 강남구 역삼동 123-45',
    latitude: 37.4979,
    longitude: 127.0276,
    regionCode: '1168010100',
    status: RestaurantStatus.SUSPENDED,
    totalSanctions: 3,
    lastSanctionAt: '2024-03-14',
  },
}

const MOCK_SANCTIONS: Record<string, SanctionDto[]> = {
  '1': [
    {
      id: 's1',
      restaurantId: '1',
      sanctionType: SanctionType.LICENSE_SUSPENSION,
      severity: SanctionSeverity.HIGH,
      violationContent: '유통기한 경과 식품 사용 및 보관 기준 위반',
      dispositionContent: '영업정지 2개월 (2024.03.14 ~ 2024.05.14)',
      dispositionDate: '2024-03-14',
      legalBasis: '식품위생법 제75조',
      source: '서울특별시 강남구청',
      isVerified: true,
    },
    {
      id: 's2',
      restaurantId: '1',
      sanctionType: SanctionType.IMPROVEMENT_ORDER,
      severity: SanctionSeverity.LOW,
      violationContent: '조리사 위생교육 미이수',
      dispositionContent: '시정명령 (30일 이내 이수 완료)',
      dispositionDate: '2023-11-20',
      legalBasis: '식품위생법 제41조',
      source: '서울특별시 강남구청',
      isVerified: true,
    },
    {
      id: 's3',
      restaurantId: '1',
      sanctionType: SanctionType.WARNING,
      severity: SanctionSeverity.LOW,
      violationContent: '식품 표시 기준 일부 미준수',
      dispositionContent: '경고 처분',
      dispositionDate: '2023-06-05',
      legalBasis: '식품위생법 제10조',
      source: '서울특별시 강남구청',
      isVerified: false,
    },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RestaurantStatus, { label: string; variant: 'secondary' | 'destructive' | 'outline' | 'default'; icon: typeof ShieldCheck }> = {
  [RestaurantStatus.ACTIVE]: {
    label: '영업 중',
    variant: 'secondary',
    icon: ShieldCheck,
  },
  [RestaurantStatus.SUSPENDED]: {
    label: '영업정지',
    variant: 'destructive',
    icon: ShieldAlert,
  },
  [RestaurantStatus.CLOSED]: {
    label: '폐업',
    variant: 'outline',
    icon: ShieldAlert,
  },
  [RestaurantStatus.UNKNOWN]: {
    label: '확인 불가',
    variant: 'outline',
    icon: AlertTriangle,
  },
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const restaurant = MOCK_RESTAURANTS[params.id]
  if (!restaurant) return { title: '음식점을 찾을 수 없습니다' }

  return {
    title: `${restaurant.name} 행정처분 이력`,
    description: `${restaurant.name}의 행정처분 이력을 확인하세요. 총 ${restaurant.totalSanctions}건의 처분 기록이 있습니다.`,
  }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function RestaurantDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const restaurant = MOCK_RESTAURANTS[params.id]
  if (!restaurant) notFound()

  const sanctions = MOCK_SANCTIONS[params.id] ?? []
  const statusConfig = STATUS_CONFIG[restaurant.status]
  const StatusIcon = statusConfig.icon

  const latestSanction = sanctions[0]
  const hasCriticalHistory = sanctions.some(
    (s) => s.severity === SanctionSeverity.CRITICAL || s.severity === SanctionSeverity.HIGH,
  )

  return (
    <PageContainer noPadding className="bg-background">
      <Header
        showBack
        title={restaurant.name}
        rightSlot={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bookmark className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8 animate-fade-in">

        {/* Restaurant hero info */}
        <section aria-label={`${restaurant.name} 기본 정보`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusConfig.variant} className="gap-1.5 px-3 py-1 font-bold h-7">
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 font-bold h-7">
                  {restaurant.category}
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight tracking-tight">
                {restaurant.name}
              </h1>

              <div className="space-y-2">
                {restaurant.roadAddress && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {restaurant.roadAddress}
                      <span className="block text-xs opacity-60 mt-0.5">(지번: {restaurant.jibunAddress})</span>
                    </p>
                  </div>
                )}
                {restaurant.lastSanctionAt && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <p className="text-base text-muted-foreground">
                      최근 처분일:{' '}
                      <time dateTime={restaurant.lastSanctionAt} className="font-bold text-foreground">
                        {formatKoreanDate(restaurant.lastSanctionAt)}
                      </time>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row sm:flex-col gap-2">
              <Button className="flex-1 sm:w-40 rounded-2xl font-bold h-12 shadow-soft-xl">
                길찾기
              </Button>
              <Button variant="outline" className="flex-1 sm:w-40 rounded-2xl font-bold h-12">
                오류 제보
              </Button>
            </div>
          </div>
        </section>

        {/* Warning banner for active suspension */}
        {restaurant.status === RestaurantStatus.SUSPENDED && (
          <section aria-label="현재 영업정지 안내">
            <Card className="bg-destructive/10 border-destructive/20 border-2 rounded-3xl overflow-hidden animate-severity-pulse">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 bg-destructive/20 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-destructive mb-1">현재 영업정지 상태입니다</h3>
                  {latestSanction && (
                    <p className="text-sm font-medium text-destructive/80 leading-relaxed">
                      {latestSanction.dispositionContent}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-destructive/60 uppercase tracking-widest">
                    <Info className="w-3.5 h-3.5" />
                    식품위생법 위반 데이터 기반
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="sanctions" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-12 p-0 gap-6">
            <TabsTrigger value="sanctions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-2 font-bold text-base">
              행정처분 이력
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 min-w-[20px] justify-center">{sanctions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-2 font-bold text-base">
              업체 상세정보
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sanctions" className="pt-8 space-y-8">
            {/* Sanction stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-none bg-muted/30">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-primary mb-1">{sanctions.length}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">누적 처분</span>
                </CardContent>
              </Card>
              <Card className="border-none bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-severity-critical mb-1">
                    {sanctions.filter((s) => s.severity === SanctionSeverity.HIGH || s.severity === SanctionSeverity.CRITICAL).length}
                  </span>
                  <span className="text-xs font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-widest">고위험 처분</span>
                </CardContent>
              </Card>
              <Card className="border-none bg-teal-50 dark:bg-teal-950/20">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-teal-600 mb-1">
                    {sanctions.filter((s) => s.isVerified).length}
                  </span>
                  <span className="text-xs font-bold text-teal-600/70 dark:text-teal-400/70 uppercase tracking-widest">검증된 기록</span>
                </CardContent>
              </Card>
            </div>

            {/* Risk Assessment */}
            <Card className={cn(
              "border-none rounded-3xl overflow-hidden",
              hasCriticalHistory ? "bg-red-50 dark:bg-red-950/10" : "bg-primary/5"
            )}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  hasCriticalHistory ? "bg-red-100 dark:bg-red-900/30" : "bg-primary/10"
                )}>
                  {hasCriticalHistory ? (
                    <AlertTriangle className="w-6 h-6 text-severity-critical" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className={cn(
                    "text-lg font-bold mb-1",
                    hasCriticalHistory ? "text-red-800 dark:text-red-400" : "text-primary"
                  )}>
                    {hasCriticalHistory ? '위생 주의 업체 판정' : '상대적으로 양호한 위생 상태'}
                  </h3>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    hasCriticalHistory ? "text-red-700/80 dark:text-red-300/60" : "text-muted-foreground"
                  )}>
                    {hasCriticalHistory
                      ? '과거 고위험 행정처분 이력이 확인되었습니다. 위생 상태 개선 여부를 확인하시기 바랍니다.'
                      : '최근 심각한 행정처분 이력이 발견되지 않았습니다. 안심하고 이용하셔도 좋습니다.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">타임라인</h3>
              </div>
              
              <Card className="border-muted/50 rounded-3xl overflow-hidden shadow-sm">
                <CardContent className="p-6 sm:p-8">
                  {sanctions.length === 0 ? (
                    <div className="py-10 text-center">
                      <ShieldCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold">기록된 행정처분이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sanctions.map((sanction, idx) => (
                        <SanctionTimelineItem
                          key={sanction.id}
                          sanction={sanction}
                          isLatest={idx === 0}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="info" className="pt-8">
            <Card className="border-muted/50 rounded-3xl overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">업종 카테고리</p>
                    <p className="text-lg font-bold text-foreground">{restaurant.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">지역 코드</p>
                    <p className="text-lg font-bold text-foreground">{restaurant.regionCode}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">상세 주소</p>
                    <p className="text-lg font-bold text-foreground">{restaurant.roadAddress}</p>
                    <p className="text-sm text-muted-foreground">지번: {restaurant.jibunAddress}</p>
                  </div>
                </div>
                
                <div className="pt-6 border-t">
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">
                      상세 영업 상태는 지자체 인허가 시스템 데이터와 실제 현장이 다를 수 있습니다. 
                      정확한 정보는 해당 업소나 관할 구청에 확인하시기 바랍니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Source attribution */}
        <section className="pt-4">
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 text-muted-foreground">
            <ExternalLink className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-60" />
            <p className="text-xs leading-relaxed">
              <strong>데이터 출처 안내:</strong> 본 페이지의 정보는 식품의약품안전처(식품안전나라) 및 각 지방자치단체에서 공개하는 
              행정처분 공공데이터를 가공하여 제공합니다. 데이터의 무단 전재 및 재배포를 금하며, 
              법적 효력을 갖는 증빙 자료로 사용할 수 없습니다.
            </p>
          </div>
        </section>

      </div>
    </PageContainer>
  )
}
