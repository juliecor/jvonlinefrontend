"use client"

import { useActionState, useEffect, useRef } from "react"
import { LoaderCircle, Send } from "lucide-react"
import { Alert, Label, fieldClass } from "@/components/form"
import { type AgentInviteState, inviteAgent } from "./actions"

export function InviteAgentForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<AgentInviteState, FormData>(inviteAgent.bind(null, slug), {})
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.sent) form.current?.reset()
  }, [state])

  return (
    <form ref={form} action={action} className="grid gap-4 sm:grid-cols-[1fr_1.2fr_auto] sm:items-end">
      <label className="block">
        <Label>Agent&apos;s name</Label>
        <input name="name" required placeholder="Full name" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Email</Label>
        <input name="email" type="email" required placeholder="agent@example.com" className={fieldClass} />
      </label>
      <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Invite
      </button>
      {state.error && <div className="sm:col-span-3"><Alert kind="error">{state.error}</Alert></div>}
      {state.sent && <div className="sm:col-span-3"><Alert kind="success">{state.sent}</Alert></div>}
    </form>
  )
}
