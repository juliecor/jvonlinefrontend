"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { confirmAction } from "./feedback"

/** Copies a link to the clipboard; falls back to selecting it when the clipboard isn't available (http on a phone). */
export function CopyButton({ text, label = "Copy link", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      await confirmAction({ title: "Copy this", body: "This browser didn't let the page copy it. Tap the box, select all and copy.", copy: text, confirm: "Done" })
      return
    }
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <button type="button" onClick={copy} className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 ${className}`}>
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied" : label}
    </button>
  )
}
