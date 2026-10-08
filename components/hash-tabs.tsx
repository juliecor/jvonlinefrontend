"use client"

import { useSyncExternalStore } from "react"

export type HashTab = {
  id: string
  label: string
  /** A shorter label for phones, where three tabs share a row. */
  short?: string
  /** A count or mark beside the label: "0/3", 2, "✓". */
  badge?: string | number | null
  /** accent: needs attention (new answers, files to review). */
  tone?: "neutral" | "accent" | "good"
  content: React.ReactNode
}

// The open tab lives in the address (#requirements…), so Back, Forward and shared
// links work; nothing on the page carries those ids, so it doesn't jump.
const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}
const readHash = () => window.location.hash.slice(1)
const serverHash = () => ""

const BADGE = {
  neutral: "bg-[#f1eee9] text-[#3d3a34]",
  accent: "bg-[var(--accent)] text-white",
  good: "bg-emerald-100 text-emerald-800",
}

/**
 * A dashboard page in sections instead of one long scroll. Every panel stays
 * rendered (forms keep what was typed); only the open one shows. On a phone
 * the tabs wrap into rows of three instead of scrolling sideways.
 */
export function HashTabs({ tabs }: { tabs: HashTab[] }) {
  const hash = useSyncExternalStore(subscribe, readHash, serverHash)
  const active = tabs.some((t) => t.id === hash) ? hash : tabs[0].id

  return (
    <div className="mt-8">
      <div role="tablist" className="grid grid-cols-3 border-b-2 border-[#17150f] sm:flex sm:flex-wrap">
        {tabs.map((t) => {
          const on = t.id === active
          return (
            <a
              key={t.id}
              href={`#${t.id}`}
              role="tab"
              aria-selected={on}
              className={`relative flex items-center justify-center gap-2 px-2 py-3 text-sm font-bold transition sm:justify-start sm:px-5 sm:text-[15px] ${on ? "bg-white text-[#17150f]" : "text-[#6b665d] hover:bg-white/60 hover:text-[#17150f]"}`}
            >
              <span className="truncate">
                <span className="sm:hidden">{t.short ?? t.label}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </span>
              {t.badge !== undefined && t.badge !== null && t.badge !== "" && <span className={`shrink-0 px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${BADGE[t.tone ?? "neutral"]}`}>{t.badge}</span>}
              <span aria-hidden className={`absolute inset-x-0 -bottom-[2px] h-[3px] bg-[var(--accent)] transition-opacity ${on ? "opacity-100" : "opacity-0"}`} />
            </a>
          )
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" aria-label={t.label} hidden={t.id !== active}>
          {t.content}
        </div>
      ))}
    </div>
  )
}
