import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  withHeader?: boolean
  withBottomNav?: boolean
}

export function PageContainer({
  children,
  className,
  noPadding = false,
  withHeader = true,
  withBottomNav = true,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'min-h-screen w-full flex flex-col bg-background relative',
        withHeader && 'pt-[var(--header-height)] sm:pt-0',
        withBottomNav && 'pb-[calc(var(--nav-height)+var(--safe-bottom))] sm:pb-0',
        className
      )}
    >
      <main
        className={cn(
          'flex-1 w-full max-w-screen-2xl mx-auto',
          !noPadding && 'px-4 sm:px-6 lg:px-8',
          'animate-fade-in'
        )}
      >
        {children}
      </main>
    </div>
  )
}
