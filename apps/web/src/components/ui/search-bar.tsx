'use client'

import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

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
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-base sm:text-lg',
  }

  return (
    <form
      role="search"
      aria-label="음식점 검색"
      onSubmit={handleSubmit}
      className={cn('relative w-full group', className)}
    >
      <div
        className={cn(
          'flex items-center gap-2 w-full rounded-2xl border bg-background transition-all duration-300',
          isFocused
            ? 'border-primary ring-4 ring-primary/10 shadow-lg'
            : 'border-border shadow-sm group-hover:border-primary/50',
          sizeClasses[size],
          'px-3 sm:px-4'
        )}
      >
        <Search
          className={cn(
            'flex-shrink-0 transition-colors duration-300 w-5 h-5',
            isFocused ? 'text-primary' : 'text-muted-foreground',
          )}
          aria-hidden="true"
        />

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
            'flex-1 min-w-0 bg-transparent border-none outline-none ring-0 focus:ring-0 placeholder:text-muted-foreground/60',
            'text-foreground font-medium',
            '[&::-webkit-search-cancel-button]:hidden',
          )}
        />

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            aria-label="검색어 지우기"
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        <Button
          type="submit"
          disabled={!value.trim()}
          variant={value.trim() ? 'primary' : 'secondary'}
          size={size === 'sm' ? 'sm' : 'md'}
          className={cn(
            'flex-shrink-0 rounded-xl font-bold transition-all duration-300',
            size === 'lg' && 'sm:px-6'
          )}
        >
          검색
        </Button>
      </div>
    </form>
  )
}
