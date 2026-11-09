'use client'

import { useEffect, useState } from 'react'
import { isCurrentUserAdmin } from '@/lib/auth/actions'

/** True when the visitor is logged in as admin. Starts false until the check finishes. */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    isCurrentUserAdmin()
      .then(result => { if (!cancelled) setIsAdmin(result) })
      .catch(() => { if (!cancelled) setIsAdmin(false) })
    return () => { cancelled = true }
  }, [])

  return isAdmin
}
