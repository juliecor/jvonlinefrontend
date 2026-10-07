"use client"

import { useActionState, useState } from "react"
import { Link2, LoaderCircle } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { btn, field } from "@/components/dashboard-ui"
import { Alert, Label } from "@/components/form"
import { type AgentInviteState, inviteAgent } from "./actions"

/** Name (and optionally email and mobile number) → a link to copy and send over Messenger, Viber or email. */
export function InviteAgentForm({ slug }: { slug: string }) {
  // Remounting the inner form is the simplest way to start a fresh invite after one is made.
  const [round, setRound] = useState(0)
  return <InviteForm key={round} slug={slug} onAnother={() => setRound((r) => r + 1)} />
}

function InviteForm({ slug, onAnother }: { slug: string; onAnother: () => void }) {
  const [state, action, pending] = useActionState<AgentInviteState, FormData>(inviteAgent.bind(null, slug), {})
  const [phone, setPhone] = useState("")

  if (state.url) {
    return (
      <div className="rounded-md border border-[var(--accent)]/40 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Link ready for {state.name}</p>
        <p className="mt-2 text-sm text-[#6b665d]">Send it however you talk to them. It opens a short form where they add their details and choose a password; you approve them here. It works for 7 days.</p>
        <p className="mt-3 break-all rounded-md border border-[#e6e2db] bg-[#f6f4f0] px-3.5 py-2.5 font-mono text-sm">{state.url}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={state.url} className="bg-white" />
          <a href={`https://wa.me/?text=${encodeURIComponent(`Hi ${state.name}, here's your link to join our team: ${state.url}`)}`} target="_blank" rel="noreferrer" className={btn.ghost}>WhatsApp</a>
          <a href={`viber://forward?text=${encodeURIComponent(`Hi ${state.name}, here's your link to join our team: ${state.url}`)}`} className={btn.ghost}>Viber</a>
          <a href={`mailto:?subject=${encodeURIComponent("Your invitation")}&body=${encodeURIComponent(`Hi ${state.name},\n\nHere's your link to join our team: ${state.url}\n\nIt works for 7 days.`)}`} className={btn.ghost}>Email</a>
          <button type="button" onClick={onAnother} className={btn.ghost}>Invite another</button>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 sm:items-end lg:grid-cols-[1fr_1fr_1fr_auto]">
      <label className="block">
        <Label>Agent&apos;s name</Label>
        <input name="name" required placeholder="Full name" className={field} />
      </label>
      <label className="block">
        <Label>Email (optional)</Label>
        <input name="email" type="email" placeholder="They can fill this in themselves" className={field} />
      </label>
      <label className="block">
        <Label>Contact number (optional)</Label>
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={11}
          pattern="09[0-9]{9}"
          title="11-digit mobile number starting with 09, like 09171234567"
          placeholder="09171234567"
          value={phone}
          // Numbers only, like the join form: anything else is dropped as staff type or paste.
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          className={field}
        />
      </label>
      <button type="submit" disabled={pending} className={btn.primary}>
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        Make invite link
      </button>
      {state.error && <div className="sm:col-span-2 lg:col-span-4"><Alert kind="error">{state.error}</Alert></div>}
    </form>
  )
}
