"use client"

import { useActionState } from "react"
import { LoaderCircle, RotateCw } from "lucide-react"
import { type ResendAgentState, resendAgentInvite } from "./actions"

export function ResendAgentButton({ slug, id }: { slug: string; id: number }) {
  const [state, action, pending] = useActionState<ResendAgentState, FormData>(resendAgentInvite.bind(null, slug), {})
  return (
    <form action={action} className="flex flex-col items-start gap-1 sm:items-end">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:opacity-60">
        {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
        Resend
      </button>
      {state.sent && <span className="text-xs text-emerald-700">{state.sent}</span>}
      {state.error && <span className="text-xs text-red-700">{state.error}</span>}
    </form>
  )
}
