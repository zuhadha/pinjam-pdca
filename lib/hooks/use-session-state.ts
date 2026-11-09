'use client'

import { useCallback, useMemo, useState, useSyncExternalStore, type SetStateAction } from 'react'

const PREFIX = 'pinjam_pdca:'

function readSession<T>(key: string): T | undefined {
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key)
    return raw === null ? undefined : (JSON.parse(raw) as T)
  } catch {
    return undefined
  }
}

function writeSession(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage can be blocked (private mode, quota); filters just won't persist.
  }
}

const noopSubscribe = () => () => {}

/** false during server render and hydration, true afterwards. */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

/**
 * useState that survives page navigation within the same browser tab.
 * The stored value is only read after hydration so server and client markup match.
 */
export function useSessionState<T>(key: string, initial: T): [T, (action: SetStateAction<T>) => void] {
  const hydrated = useHydrated()
  const [override, setOverride] = useState<{ value: T } | null>(null)

  const base = useMemo(() => {
    if (!hydrated) return initial
    const stored = readSession<T>(key)
    if (stored === undefined) return initial
    // Merge so filter fields added later still get their defaults.
    return initial && typeof initial === 'object' && !Array.isArray(initial)
      ? { ...initial, ...stored }
      : stored
    // `initial` is a fresh literal on every render; only the key matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key])

  const value = override ? override.value : base

  const setValue = useCallback((action: SetStateAction<T>) => {
    setOverride(prev => {
      const current = prev ? prev.value : base
      const next = typeof action === 'function' ? (action as (p: T) => T)(current) : action
      writeSession(key, next)
      return { value: next }
    })
  }, [base, key])

  return [value, setValue]
}

export function readSessionValue<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined
  return readSession<T>(key)
}

export function writeSessionValue(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  writeSession(key, value)
}
