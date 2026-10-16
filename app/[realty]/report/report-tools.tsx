"use client"

import { useEffect } from "react"
import { Download } from "lucide-react"

/** The browser's print window, where "Save as PDF" makes the file. */
export function DownloadPdf() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110">
      <Download className="h-5 w-5" /> Download PDF
    </button>
  )
}

/** Opened from the AI's Download PDF: the print window comes up by itself once the page has drawn. */
export function PrintOnOpen() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      window.print()
      // Back to the plain address, so a refresh doesn't print again.
      window.history.replaceState(null, "", window.location.pathname + window.location.search.replace(/[?&]print=1/, "").replace(/^&/, "?"))
    }, 700)
    return () => window.clearTimeout(t)
  }, [])
  return null
}
