"use client"

import { useActionState, useState } from "react"
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { btn, field } from "@/components/dashboard-ui"
import { Alert, Label } from "@/components/form"
import { type InviteRealtyState, inviteRealty } from "./actions"

/** Email only: the realty tells us the rest in the accreditation form. */
export function InviteRealtyForm({ slug }: { slug: string }) {
  // Remounting the inner form is the simplest way to start a fresh invite after one is sent.
  const [round, setRound] = useState(0)
  return <InviteForm key={round} slug={slug} onAnother={() => setRound((r) => r + 1)} />
}

function InviteForm({ slug, onAnother }: { slug: string; onAnother: () => void }) {
  const [state, action, pending] = useActionState<InviteRealtyState, FormData>(inviteRealty.bind(null, slug), {})

  if (state.sent) {
    const { email, emailed, accreditation_url: url } = state.sent
    return (
      <div className={`border-l-4 p-5 ${emailed ? "border-emerald-600 bg-emerald-50" : "border-amber-500 bg-amber-50"}`}>
        <p className={`flex items-center gap-2 text-sm font-bold ${emailed ? "text-emerald-900" : "text-amber-900"}`}>
          {emailed ? <CircleCheck className="h-5 w-5 text-emerald-700" /> : <TriangleAlert className="h-5 w-5 text-amber-700" />}
          {emailed ? `Invite emailed to ${email}.` : `We couldn't email ${email}. Send them this link yourself.`}
        </p>
        <p className="mt-2 text-sm text-[#5a554d]">It opens the accreditation form and works for 7 days, once. You can also pass the link on by hand:</p>
        <p className="mt-3 break-all rounded-md border border-[#e6e2db] bg-white px-3.5 py-2.5 font-mono text-sm">{url}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={url} className="bg-white" />
          <button type="button" onClick={onAnother} className={btn.ghost}>
            Invite another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="block">
        <Label>Send the invite to</Label>
        <input name="email" type="email" required placeholder="name@realty.com" autoComplete="off" className={field} />
      </label>
      <button type="submit" disabled={pending} className={btn.primary}>
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Invite
      </button>
      {state.error && (
        <div className="sm:col-span-2">
          <Alert kind="error">{state.error}</Alert>
        </div>
      )}
    </form>
  )
}
