'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { readSessionValue, writeSessionValue } from '@/lib/hooks/use-session-state'

/**
 * For pages whose filters live in the URL: remember the query string, and when the
 * page is opened again without one (e.g. from the sidebar), put the last filters back.
 */
export function useRestoreSearchParams(storageKey: string) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!checkedRef.current) {
      checkedRef.current = true
      const saved = readSessionValue<string>(storageKey)
      if (!query && saved) {
        router.replace(`${pathname}?${saved}`)
        return
      }
    }
    writeSessionValue(storageKey, query)
  }, [query, pathname, router, storageKey])
}
