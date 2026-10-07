"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

/**
 * A page shown as a dialog in the middle of the screen (an intercepted route,
 * see app/[realty]/dashboard/@modal). Closing it — X, Esc — goes back to the
 * page underneath; opening the same address directly shows the full page.
 */
export function RouteModal({ eyebrow, title, wide = false, children }: { eyebrow: string; title: string; wide?: boolean; children: React.ReactNode }) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialog.current
    if (d && !d.open) d.showModal()
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = overflow
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        router.back()
      }}
      className={`fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto border-t-4 border-[var(--accent)] bg-[#f6f4f0] p-0 text-[#17150f] shadow-2xl backdrop:bg-[#17150f]/55 ${wide ? "max-w-5xl" : "max-w-3xl"}`}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e6e2db] bg-white px-5 py-4 sm:px-7 sm:py-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
        </div>
        <button type="button" onClick={() => router.back()} aria-label="Close" className="-mr-2 p-2 text-[#6b665d] transition hover:bg-[#f6f4f0] hover:text-[#17150f]">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-5 py-6 sm:px-7">{children}</div>
    </dialog>
  )
}
