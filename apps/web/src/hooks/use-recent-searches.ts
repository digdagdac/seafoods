'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'safedeliver-recent-searches'
const MAX_ITEMS = 10

function readFromStorage(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeToStorage(searches: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([])

  useEffect(() => {
    setSearches(readFromStorage())
  }, [])

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setSearches(prev => {
      const deduped = prev.filter(s => s !== trimmed)
      const next = [trimmed, ...deduped].slice(0, MAX_ITEMS)
      writeToStorage(next)
      return next
    })
  }, [])

  const clearSearches = useCallback(() => {
    writeToStorage([])
    setSearches([])
  }, [])

  return { searches, addSearch, clearSearches }
}
