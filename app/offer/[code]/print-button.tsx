"use client"

import { Printer } from "lucide-react"

/** The browser's print dialog doubles as "Save as PDF". Hidden on the printed page. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 print:hidden">
      <Printer className="h-4 w-4" /> Print / save as PDF
    </button>
  )
}
