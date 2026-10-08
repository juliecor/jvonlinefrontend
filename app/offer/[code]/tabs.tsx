"use client"

import { useEffect, useSyncExternalStore } from "react"

export type OfferTab = {
  id: string
  label: string
  /** A shorter label for phones. */
  short?: string
  content: React.ReactNode
  /** false: left out of the printed PDF (the forms). */
  print?: boolean
  /** The call to action: marked even when it isn't the open tab. */
  cta?: boolean
}

// The open tab lives in the address (#payment, #requirements…), so emailed links,
// Back and Forward all work; no element carries those ids, so the page doesn't jump.
const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}
const readHash = () => window.location.hash.slice(1)
const serverHash = () => ""

/**
 * The offer in sections instead of one long page: the top bar holds the tabs.
 * Every panel stays rendered (forms keep what the buyer typed); the ones not
 * open are hidden on screen and all of them print, so Save as PDF is the whole offer.
 */
export function OfferTabs({ bar, actions, tabs, children }: { bar: React.ReactNode; actions: React.ReactNode; tabs: OfferTab[]; children: React.ReactNode }) {
  const hash = useSyncExternalStore(subscribe, readHash, serverHash)
  const active = tabs.some((t) => t.id === hash) ? hash : tabs[0].id

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [active])

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-[#ddd8d0] bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto max-w-[1040px] px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 pb-2 pt-3">
            {bar}
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          </div>
          <nav role="tablist" aria-label="Sections of this offer" className="-mx-4 flex justify-between overflow-x-auto px-2 [scrollbar-width:none] sm:mx-0 sm:justify-start sm:px-0 [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => {
              const on = t.id === active
              return (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  role="tab"
                  aria-selected={on}
                  className={`relative shrink-0 whitespace-nowrap px-2 py-3 text-sm font-bold transition sm:px-4 sm:text-[15px] ${on ? "text-[#17150f]" : t.cta ? "text-[var(--accent)] hover:text-[#17150f]" : "text-[#6b665d] hover:text-[#17150f]"}`}
                >
                  {t.short ? (
                    <>
                      <span className="sm:hidden">{t.short}</span>
                      <span className="hidden sm:inline">{t.label}</span>
                    </>
                  ) : (
                    t.label
                  )}
                  {t.cta && !on && <span aria-hidden className="ml-1.5 inline-block h-1.5 w-1.5 -translate-y-0.5 bg-[var(--accent)]" />}
                  <span aria-hidden className={`absolute inset-x-2 bottom-0 h-[3px] bg-[var(--accent)] transition-opacity sm:inset-x-4 ${on ? "opacity-100" : "opacity-0"}`} />
                </a>
              )
            })}
          </nav>
        </div>
      </div>

      <article className="mx-auto max-w-[1040px] bg-white sm:mt-8 sm:border sm:border-[#e0dcd5] print:mt-0 print:max-w-none print:border-0">
        <div className="h-1.5 bg-[var(--accent)]" />
        {tabs.map((t) => (
          <div key={t.id} role="tabpanel" aria-label={t.label} className={`${t.id === active ? "" : "hidden"} ${t.print === false ? "print:hidden" : "print:block"}`}>
            {t.content}
          </div>
        ))}
        {children}
      </article>
    </>
  )
}
