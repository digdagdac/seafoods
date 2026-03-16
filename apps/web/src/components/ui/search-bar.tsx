'use client'

import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  onSearch?: (value: string) => void
  autoFocus?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SearchBar({
  defaultValue = '',
  placeholder = '음식점 이름, 주소로 검색',
  onSearch,
  autoFocus = false,
  className,
  size = 'md',
}: SearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    if (onSearch) {
      onSearch(trimmed)
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleClear() {
    setValue('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      handleClear()
    }
  }

  const sizeClasses = {
    sm: 'h-10 text-sm px-3',
    md: 'h-12 text-base px-4',
    lg: 'h-14 text-base px-5',
  }

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  }

  return (
    <form
      role="search"
      aria-label="음식점 검색"
      onSubmit={handleSubmit}
      className={cn('relative w-full', className)}
    >
      <div
        className={cn(
          'flex items-center gap-2 w-full rounded-2xl border bg-white transition-all duration-200',
          isFocused
            ? 'border-navy shadow-[0_0_0_3px_rgba(27,43,75,0.12)]'
            : 'border-gray-200 shadow-card',
          sizeClasses[size],
        )}
      >
        {/* Search icon */}
        <Search
          className={cn(
            'flex-shrink-0 transition-colors duration-150',
            iconSize[size],
            isFocused ? 'text-navy' : 'text-gray-400',
          )}
          aria-hidden="true"
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={placeholder}
          className={cn(
            'flex-1 min-w-0 bg-transparent outline-none placeholder:text-gray-400',
            'text-gray-900 font-medium',
            // Hide the native clear button on webkit
            '[&::-webkit-search-cancel-button]:hidden',
          )}
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="검색어 지우기"
            className={cn(
              'flex-shrink-0 flex items-center justify-center rounded-full',
              'w-5 h-5 bg-gray-200 text-gray-500',
              'hover:bg-gray-300 transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40',
            )}
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          aria-label="검색"
          disabled={!value.trim()}
          className={cn(
            'flex-shrink-0 flex items-center justify-center rounded-xl',
            'transition-all duration-150 font-medium text-sm',
            size === 'sm' ? 'h-7 px-2.5' : 'h-8 px-3',
            value.trim()
              ? 'bg-navy text-white hover:bg-navy-medium active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
        >
          검색
        </button>
      </div>
    </form>
  )
}
