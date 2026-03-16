import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1B2A4A',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKr.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (theme === 'dark' || (theme === 'system' && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <QueryProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <main id="main-content" className="flex-1 relative">
                {children}
              </main>
              <BottomNav />
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}
