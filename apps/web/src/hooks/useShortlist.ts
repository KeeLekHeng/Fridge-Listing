import { useState, useEffect, useCallback } from 'react'

const KEY = 'chillix:shortlist'
const MAX = 5

function readStorage(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function writeStorage(ids: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(ids))
}

export function useShortlist() {
  const [ids, setIds] = useState<string[]>(readStorage)

  // Keep in sync if another tab modifies storage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setIds(readStorage())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((id: string): { ok: boolean; error?: string } => {
    if (ids.includes(id)) return { ok: false, error: 'Already in shortlist' }
    if (ids.length >= MAX) {
      return { ok: false, error: `Your shortlist is full (max ${MAX}). Remove a fridge first.` }
    }
    const next = [...ids, id]
    writeStorage(next)
    setIds(next)
    return { ok: true }
  }, [ids])

  const remove = useCallback((id: string) => {
    const next = ids.filter(x => x !== id)
    writeStorage(next)
    setIds(next)
  }, [ids])

  const has = useCallback((id: string) => ids.includes(id), [ids])

  return { ids, count: ids.length, add, remove, has, isFull: ids.length >= MAX }
}
