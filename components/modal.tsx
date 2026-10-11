"use client"

import { useEffect, useId, useState } from "react"
import { X } from "lucide-react"

/**
 * A dialog in the middle of the screen, opened and closed by its parent
 * (open / onClose), in the same style as Add unit. Esc, the backdrop and
 * the X all close it.
 */
export function Modal({ open, onClose, eyebrow, title, children }: { open: boolean; onClose: () => void; eyebrow?: string; title: string; children: React.ReactNode }) {
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)
  const heading = useId()

  useEffect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open, dialog])

  // The page behind doesn't scroll while it's open.
  useEffect(() => {
    if (!open) return
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = overflow
    }
  }, [open])

  return (
    <dialog
      ref={setDialog}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={heading}
      className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border-t-4 border-[var(--accent)] bg-white p-0 text-[#17150f] shadow-2xl backdrop:bg-[#17150f]/55"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#e6e2db] px-5 py-4 sm:px-7 sm:py-5">
        <div>
          {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>}
          <h2 id={heading} className="mt-1 text-2xl font-bold tracking-tight">
            {title}
          </h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 p-2 text-[#6b665d] transition hover:bg-[#f6f4f0] hover:text-[#17150f]">
          <X className="h-5 w-5" />
        </button>
      </div>
      {open && <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>}
    </dialog>
  )
}
