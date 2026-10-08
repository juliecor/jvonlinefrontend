"use client"

import { useState, useSyncExternalStore } from "react"
import { Check, Copy, Share2 } from "lucide-react"
import { confirmAction } from "./feedback"

const noop = () => () => {}
const canShare = () => typeof navigator.share === "function"

/**
 * A message the AI wrote for a buyer, ready for Viber, SMS or email: Copy,
 * and on phones Share, which opens the phone's own list (Viber, Messenger…).
 */
export function MessageDraft({ text, to = "", writing = false }: { text: string; to?: string; writing?: boolean }) {
  const [copied, setCopied] = useState(false)
  const share = useSyncExternalStore(noop, canShare, () => false)
  // Plain text for the buyer's phone, even if a bit of Markdown slipped in.
  const message = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\((\S+?)\)/g, "$2").trim()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
    } catch {
      await confirmAction({ title: "Copy this message", body: "This browser didn't let the page copy it. Tap the box, select all and copy.", copy: message, confirm: "Done" })
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="border border-l-4 border-[#e0dcd5] border-l-[var(--accent)] bg-[#faf8f5]">
      <div className="flex items-center justify-between gap-2 border-b border-[#e6e2db] px-4 py-2">
        <p className="min-w-0 truncate text-xs font-bold uppercase tracking-[0.14em] text-[#6b665d]">Message for {to || "the buyer"}</p>
        {writing && <p className="text-xs font-semibold text-[#8a847a]">Writing…</p>}
      </div>
      <p className="whitespace-pre-wrap px-4 py-3 text-[15px] leading-relaxed text-[#17150f] [overflow-wrap:anywhere]">{message}</p>
      {!writing && (
        <div className="flex flex-wrap gap-2 border-t border-[#e6e2db] px-4 py-3">
          <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 bg-[var(--accent)] px-3.5 py-2 text-sm font-bold text-white transition hover:brightness-110">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy message"}
          </button>
          {share && (
            <button type="button" onClick={() => navigator.share({ text: message }).catch(() => {})} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-3.5 py-2 text-sm font-bold text-[#17150f] transition hover:border-[#17150f]">
              <Share2 className="h-4 w-4" /> Share
            </button>
          )}
        </div>
      )}
    </div>
  )
}
