"use client"

import { useEffect } from "react"
import { refreshCounts } from "../actions"

/**
 * Opening an offer marks its responses as seen; this refreshes the sidebar's
 * "new" count to match, once, after the page has shown.
 */
export function SyncCounts({ slug }: { slug: string }) {
  useEffect(() => {
    refreshCounts(slug)
  }, [slug])
  return null
}
