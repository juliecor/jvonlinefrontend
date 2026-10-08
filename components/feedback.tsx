"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"

/**
 * The dashboard's own messages instead of the browser's grey pop-ups:
 * toast("Chat deleted") slides up at the bottom and goes away by itself, and
 * confirmAction({…}) asks "Are you sure?" in a box that looks like the rest of
 * the dashboard. <Feedback /> draws both; each dashboard shell mounts it once.
 */

type Toast = { id: number; kind: "success" | "error" | "info"; text: string }
type Question = {
  title: string
  body?: string
  /** The button that goes ahead, e.g. "Delete chat". */
  confirm?: string
  cancel?: string
  /** A delete or anything that can't be undone: the button turns red. */
  danger?: boolean
  /** Show this text ready to copy by hand (when the phone won't let the page copy it). */
  copy?: string
}

let toasts: Toast[] = []
let question: (Question & { resolve: (ok: boolean) => void }) | null = null
const listeners = new Set<() => void>()
const changed = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const NO_TOASTS: Toast[] = []

let nextId = 1
export function toast(text: string, kind: Toast["kind"] = "success") {
  const id = nextId++
  toasts = [...toasts, { id, kind, text }].slice(-3)
  changed()
  setTimeout(() => dismiss(id), kind === "error" ? 6500 : 3500)
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  changed()
}

/** "Are you sure?" in the dashboard's own box. Resolves true when they go ahead. */
export function confirmAction(q: Question): Promise<boolean> {
  // A page without <Feedback /> mounted: the browser's own box still asks.
  if (listeners.size === 0) {
    if (q.copy !== undefined) {
      window.prompt(q.title, q.copy)
      return Promise.resolve(true)
    }
    return Promise.resolve(window.confirm([q.title, q.body].filter(Boolean).join("\n\n")))
  }
  return new Promise((resolve) => {
    question?.resolve(false)
    question = { ...q, resolve }
    changed()
  })
}

function answer(ok: boolean) {
  const q = question
  question = null
  changed()
  q?.resolve(ok)
}

/**
 * For a <form action={…}>: asks first and sends the form only when confirmed,
 * e.g. <form action={remove} onSubmit={confirmSubmit({ title: "Delete this unit?", danger: true })}>.
 */
export function confirmSubmit(q: Question) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    if (form.dataset.confirmed) {
      delete form.dataset.confirmed
      return
    }
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter
    void confirmAction(q).then((ok) => {
      if (!ok || !form.isConnected) return
      form.dataset.confirmed = "1"
      form.requestSubmit(submitter instanceof HTMLButtonElement ? submitter : undefined)
    })
  }
}

/** The toasts and the confirm box, once per page. */
export function Feedback() {
  const list = useSyncExternalStore(subscribe, () => toasts, () => NO_TOASTS)
  const q = useSyncExternalStore(
    subscribe,
    () => question,
    () => null,
  )

  return (
    <>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {list.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-md animate-[jv-toast-in_0.22s_ease-out] items-start gap-3 border-l-4 bg-[#17150f] py-3 pl-4 pr-2 text-[15px] font-semibold text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] ${t.kind === "error" ? "border-red-500" : t.kind === "info" ? "border-sky-400" : "border-emerald-400"}`}
          >
            {t.kind === "error" ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" /> : t.kind === "info" ? <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />}
            <span className="min-w-0 flex-1 leading-snug">{t.text}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-my-1 p-1.5 text-white/60 transition hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <ConfirmBox q={q} />
    </>
  )
}

function ConfirmBox({ q }: { q: Question | null }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (q && !d.open) d.showModal()
    if (!q && d.open) d.close()
  }, [q])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="jv-confirm-title"
      onCancel={(e) => {
        e.preventDefault()
        answer(false)
      }}
      onClick={(e) => e.target === e.currentTarget && answer(false)}
      className={`fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-md border-t-4 bg-white p-0 text-[#17150f] shadow-2xl backdrop:bg-[#17150f]/55 ${q?.danger ? "border-red-600" : "border-[var(--accent,#17150f)]"}`}
    >
      {q && (
        <div className="p-6">
          <h2 id="jv-confirm-title" className="text-xl font-bold tracking-tight">
            {q.title}
          </h2>
          {q.body && <p className="mt-2 text-[15px] leading-relaxed text-[#5a554d]">{q.body}</p>}
          {q.copy !== undefined && (
            <textarea
              readOnly
              rows={Math.min(8, Math.max(2, q.copy.split("\n").length + Math.floor(q.copy.length / 48)))}
              value={q.copy}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Text to copy"
              className="mt-4 block w-full resize-none break-all border border-[#d9d4cb] bg-[#faf8f5] px-3 py-2.5 font-mono text-sm outline-none focus:border-[var(--accent,#17150f)]"
            />
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {q.copy === undefined && (
              <button type="button" onClick={() => answer(false)} className="border border-[#d9d4cb] bg-white px-5 py-2.5 text-sm font-bold text-[#17150f] transition hover:border-[#17150f]">
                {q.cancel ?? "Cancel"}
              </button>
            )}
            <button
              type="button"
              onClick={() => answer(true)}
              className={`px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 ${q.danger ? "bg-red-700" : "bg-[var(--accent,#17150f)]"}`}
            >
              {q.confirm ?? "OK"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
