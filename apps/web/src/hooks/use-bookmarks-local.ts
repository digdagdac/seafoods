'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'safedeliver-bookmarks'

export interface LocalBookmark {
  id: string
  name: string
  category: string
  addedAt: string
}

function readFromStorage(): LocalBookmark[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LocalBookmark[]) : []
  } catch {
    return []
  }
}

function writeToStorage(bookmarks: LocalBookmark[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}

export function useLocalBookmarks() {
  const [bookmarks, setBookmarks] = useState<LocalBookmark[]>([])

  useEffect(() => {
    setBookmarks(readFromStorage())
  }, [])

  const addBookmark = useCallback((restaurant: Omit<LocalBookmark, 'addedAt'>) => {
    setBookmarks(prev => {
      if (prev.some(b => b.id === restaurant.id)) return prev
      const next = [{ ...restaurant, addedAt: new Date().toISOString() }, ...prev]
      writeToStorage(next)
      return next
    })
  }, [])

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.id !== id)
      writeToStorage(next)
      return next
    })
  }, [])

  const getBookmarks = useCallback((): LocalBookmark[] => {
    return readFromStorage()
  }, [])

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some(b => b.id === id),
    [bookmarks],
  )

  return { bookmarks, addBookmark, removeBookmark, getBookmarks, isBookmarked }
}
