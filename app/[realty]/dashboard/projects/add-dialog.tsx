"use client"

import { useEffect, useId, useState } from "react"
import { Plus, X } from "lucide-react"
import { PlanForm } from "./plan-form"
import { UnitForm } from "./unit-form"

type Props = { slug: string; projectId: number; projectName: string }

/** "Add unit": the unit form in a dialog in the middle of the screen. */
export function AddUnit({ slug, projectId, projectName }: Props) {
  return <FormDialog label="Add unit" title="Add a unit" eyebrow={projectName}>{(done) => <UnitForm slug={slug} projectId={projectId} onDone={done} />}</FormDialog>
}

/** "Add payment plan": the plan form in a dialog in the middle of the screen. */
export function AddPlan({ slug, projectId, projectName }: Props) {
  return <FormDialog label="Add payment plan" title="Add a payment plan" eyebrow={projectName}>{(done) => <PlanForm slug={slug} projectId={projectId} onDone={done} />}</FormDialog>
}

/** A button that opens `children` in a modal; `done` closes it, and the next open starts with a fresh form. */
function FormDialog({ label, title, eyebrow, children }: { label: string; title: string; eyebrow: string; children: (done: () => void) => React.ReactNode }) {
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)
  const heading = useId()
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!open) return
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = overflow
    }
  }, [open])

  const show = () => {
    dialog?.showModal()
    dialog?.querySelector<HTMLInputElement>('input[name="name"]')?.focus()
    setOpen(true)
  }
  const close = () => dialog?.close()

  return (
    <>
      <button type="button" onClick={show} className="inline-flex items-center gap-1.5 bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
        <Plus className="h-4 w-4" strokeWidth={2.5} /> {label}
      </button>
      <dialog
        ref={setDialog}
        onClose={() => setOpen(false)}
        aria-labelledby={heading}
        className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto border-t-4 border-[var(--accent)] bg-white p-0 text-[#17150f] shadow-2xl backdrop:bg-[#17150f]/55"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e6e2db] px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>
            <h2 id={heading} className="mt-1 text-2xl font-bold tracking-tight">
              {title}
            </h2>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="-mr-2 p-2 text-[#6b665d] transition hover:bg-[#f6f4f0] hover:text-[#17150f]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div key={round} className="px-5 py-5 sm:px-7 sm:py-6">
          {children(() => {
            close()
            setRound((r) => r + 1)
          })}
        </div>
      </dialog>
    </>
  )
}
