"use client"

import { useActionState, useEffect, useRef } from "react"
import { LoaderCircle, Send } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { type InviteState, inviteRealty } from "./actions"

const field = "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"

export function InviteRealtyForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteRealty, {})
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.sent) form.current?.reset()
  }, [state])

  return (
    <form ref={form} action={action} className="grid gap-4 sm:grid-cols-[1.3fr_1fr_1.3fr_auto] sm:items-end">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Realty name</span>
        <input name="name" required placeholder="e.g. Johndorf Ventures Corporation" className={field} />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Address (optional)</span>
        <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
          <span className="pl-3.5 text-sm text-slate-400">jvconline.ph/</span>
          <input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Lowercase letters, numbers and dashes" placeholder="from the name" className="block w-full bg-transparent py-2.5 pr-3.5 pl-0.5 text-[15px] text-slate-900 outline-none" />
        </div>
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Send the invite to</span>
        <input name="email" type="email" required placeholder="name@realty.com" className={field} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Invite
      </button>
      {state.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 sm:col-span-4">
          {state.error}
        </p>
      )}
      {state.sent && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 sm:col-span-4">
          {state.sent}
          {state.url && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-white px-2 py-1 text-xs text-slate-800">{state.url}</code>
              <CopyButton text={state.url} className="bg-white" />
            </div>
          )}
        </div>
      )}
    </form>
  )
}
