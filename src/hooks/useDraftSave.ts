// src/hooks/useDraftSave.ts
import { useEffect, useRef } from 'react'
import type { CatchDraft } from '@/types'

const DRAFT_KEY = 'pawprint_catch_draft'
const SAVE_INTERVAL = 2000 // 2 seconds
const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

export function useDraftSave(draft: CatchDraft | null) {
  const draftRef = useRef(draft)

  // Keep draftRef up to date with the latest draft state
  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    const interval = setInterval(() => {
      if (draftRef.current) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          ...draftRef.current,
          last_saved: new Date().toISOString()
        }))
      }
    }, SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [])
}

export function loadDraft(): CatchDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as CatchDraft
    const age = Date.now() - new Date(draft.last_saved).getTime()
    if (age > MAX_AGE) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
