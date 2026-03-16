import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { BottomNav } from '@/components/layout/bottom-nav'
import { QueryProvider } from '@/providers/query-provider'
import './globals.css'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'SafeDeliver - 배달음식점 행정처분 알리미',
    template: '%s | SafeDeliver',
  },
  description:
    '배달 음식점의 행정처분 이력을 한눈에 확인하세요. 영업정지, 영업취소, 위생 위반 등 식품 안전 정보를 제공합니다.',
  keywords: ['배달음식점', '행정처분', '영업정지', '식품안전', '위생', '음식점 검색'],
  authors: [{ name: 'SafeDeliver' }],
  creator: 'SafeDeliver',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://safedeliver.kr'),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: 'SafeDeliver - 배달음식점 행정처분 알리미',
    description: '배달 음식점의 행정처분 이력을 한눈에 확인하세요.',
    siteName: 'SafeDeliver',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafeDeliver - 배달음식점 행정처분 알리미',
    description: '배달 음식점의 행정처분 이력을 한눈에 확인하세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1B2B4B',
  viewportFit: 'cover',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body>
        <QueryProvider>
          {/* Skip to main content — accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-navy focus:text-white focus:rounded-lg focus:font-medium"
          >
            본문으로 이동
          </a>

          <main id="main-content" className="page-container">
            {children}
          </main>

          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  )
}
