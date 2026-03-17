'use client'

import { useState, useEffect } from 'react'
import { Bookmark, Search, Settings, Trash2, Moon, Sun, RefreshCw, X } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useLocalBookmarks } from '@/hooks/use-bookmarks-local'
import { useRecentSearches } from '@/hooks/use-recent-searches'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DARK_MODE_KEY = 'safedeliver-dark-mode'

function readDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(DARK_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

export default function MyPage() {
  const { bookmarks, removeBookmark } = useLocalBookmarks()
  const { searches, clearSearches } = useRecentSearches()
  const [darkMode, setDarkMode] = useState(false)
  const [dataDate] = useState(() => new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }))
  const router = useRouter()

  useEffect(() => {
    setDarkMode(readDarkMode())
  }, [])

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    try {
      localStorage.setItem(DARK_MODE_KEY, String(next))
    } catch {}
  }

  function handleClearBookmarks() {
    bookmarks.forEach(b => removeBookmark(b.id))
  }

  function handleSearchClick(query: string) {
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="마이페이지" />

      <div className="px-4 pt-6 space-y-8 max-w-screen-md mx-auto">

        {/* 즐겨찾기 섹션 */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="section-title flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              즐겨찾기
            </h3>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {bookmarks.length} saved
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="card p-12 text-center border-dashed border-2 bg-gray-50/50">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Bookmark className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-base font-black text-gray-700 mb-1">즐겨찾기한 음식점이 없습니다</p>
              <p className="text-sm text-gray-400 font-medium">관심 있는 음식점을 추가해 보세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map(b => (
                <Link
                  key={b.id}
                  href={`/restaurant/${b.id}`}
                  className="flex items-center justify-between p-4 card border-navy/5 shadow-sm hover:shadow-card-hover transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-black text-navy truncate mb-0.5">{b.name}</h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-tighter">
                      {b.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); removeBookmark(b.id) }}
                    aria-label="즐겨찾기 삭제"
                    className="ml-3 w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 최근 검색 섹션 */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="section-title flex items-center gap-2">
              <Search className="w-4 h-4" />
              최근 검색
            </h3>
            {searches.length > 0 && (
              <button
                type="button"
                onClick={clearSearches}
                className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                전체 삭제
              </button>
            )}
          </div>

          {searches.length === 0 ? (
            <div className="card p-8 text-center border-dashed border-2 bg-gray-50/50">
              <p className="text-sm font-medium text-gray-400">최근 검색어가 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {searches.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSearchClick(q)}
                  className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-navy hover:text-navy hover:bg-navy-tint transition-all duration-150 shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 설정 섹션 */}
        <section>
          <h3 className="section-title px-1 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            설정
          </h3>
          <div className="card overflow-hidden border-navy/5 shadow-sm divide-y divide-gray-100">
            {/* 다크모드 토글 */}
            <div className="flex items-center justify-between p-5 min-h-[64px]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  {darkMode ? <Moon className="w-5 h-5 text-navy" /> : <Sun className="w-5 h-5 text-gray-400" />}
                </div>
                <span className="text-base font-bold text-gray-700">다크모드</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={toggleDarkMode}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40',
                  darkMode ? 'bg-navy' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* 데이터 기준일 */}
            <div className="flex items-center justify-between p-5 min-h-[64px]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-base font-bold text-gray-700">데이터 기준일</span>
              </div>
              <span className="text-sm font-medium text-gray-400">{dataDate}</span>
            </div>

            {/* 앱 버전 */}
            <div className="flex items-center justify-between p-5 min-h-[64px]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <span className="text-xs font-black text-gray-400">v</span>
                </div>
                <span className="text-base font-bold text-gray-700">앱 버전</span>
              </div>
              <span className="text-sm font-medium text-gray-400">v0.1.0</span>
            </div>
          </div>
        </section>

        {/* 데이터 관리 섹션 */}
        <section className="pb-8">
          <h3 className="section-title px-1 mb-4 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            데이터 관리
          </h3>
          <div className="card overflow-hidden border-navy/5 shadow-sm divide-y divide-gray-100">
            <button
              type="button"
              onClick={clearSearches}
              className="flex items-center gap-4 w-full p-5 min-h-[64px] hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-base font-bold text-gray-700">검색 기록 삭제</span>
            </button>
            <button
              type="button"
              onClick={handleClearBookmarks}
              className="flex items-center gap-4 w-full p-5 min-h-[64px] hover:bg-red-50 active:bg-red-100 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-base font-bold text-red-500">즐겨찾기 초기화</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
