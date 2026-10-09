"use client"

import { useActionState, useState } from "react"
import { CheckCircle2, HelpCircle, LoaderCircle, Send, ThumbsUp } from "lucide-react"
import { type RespondState, respondToOffer } from "./actions"

type Kind = "interested" | "question"

const CHOICES: { kind: Kind; title: string; text: string; icon: typeof ThumbsUp }[] = [
  { kind: "interested", title: "I'm interested", text: "I'd like to reserve or see the unit.", icon: ThumbsUp },
  { kind: "question", title: "I have a question", text: "About the unit, the payments or financing.", icon: HelpCircle },
]

const CONTACT = [
  { v: "call", l: "Call" },
  { v: "viber", l: "Viber" },
  { v: "whatsapp", l: "WhatsApp" },
  { v: "sms", l: "Text" },
  { v: "email", l: "Email" },
]

const field = "mt-1.5 block w-full border border-[#d9d4cb] bg-white px-3.5 py-3 text-[15px] text-[#17150f] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#6b665d]"

/** "What would you like to do?" — the buyer answers the offer; the agent gets a lead. */
export function RespondSection({ code, buyerName, agentName }: { code: string; buyerName: string; agentName: string }) {
  const [kind, setKind] = useState<Kind | null>(null)
  const [state, action, pending] = useActionState<RespondState, FormData>(respondToOffer.bind(null, code), {})

  if (state.done) {
    const first = (state.name ?? buyerName).split(" ")[0]
    return (
      <div className="flex items-start gap-4 border-2 border-[var(--accent)] bg-white p-6 sm:p-8">
        <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-[var(--accent)]" />
        <div>
          <p className="text-2xl font-bold tracking-tight">Thank you, {first}.</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#3d3a34]">{agentName} has your details and will get back to you soon.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CHOICES.map(({ kind: k, title, text, icon: Icon }) => {
          const on = kind === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={on}
              className={`flex items-start gap-3 border-2 p-5 text-left transition ${on ? "border-[var(--accent)] bg-white" : "border-[#e0dcd5] bg-white hover:border-[#17150f]"}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${on ? "bg-[var(--accent)] text-white" : "bg-[#f3f0eb] text-[#17150f]"}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-lg font-bold">{title}</span>
                <span className="mt-0.5 block text-sm text-[#5a554d]">{text}</span>
              </span>
            </button>
          )
        })}
      </div>

      {kind && (
        <form action={action} className="mt-5 grid gap-4 border border-[#e0dcd5] bg-white p-5 sm:grid-cols-2 sm:p-7">
          <input type="hidden" name="kind" value={kind} />
          {/* Honeypot: hidden from people, filled by bots. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <label className="block">
            <span className={label}>Your name</span>
            <input name="name" required defaultValue={buyerName} autoComplete="name" className={field} />
          </label>
          <label className="block">
            <span className={label}>Mobile number</span>
            <input name="phone" type="tel" required autoComplete="tel" placeholder="09XX XXX XXXX" className={field} />
          </label>
          <label className="block">
            <span className={label}>Email (optional)</span>
            <input name="email" type="email" autoComplete="email" className={field} />
          </label>
          <fieldset className="block">
            <legend className={label}>Best way to reach you</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {CONTACT.map((c, i) => (
                <label key={c.v} className="cursor-pointer">
                  <input type="radio" name="contact_via" value={c.v} defaultChecked={i === 0} className="peer sr-only" />
                  <span className="block border border-[#d9d4cb] px-3.5 py-2.5 text-sm font-bold text-[#3d3a34] transition peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]">
                    {c.l}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block sm:col-span-2">
            <span className={label}>{kind === "question" ? "Your question" : "Anything we should know? (optional)"}</span>
            <textarea
              name="message"
              rows={3}
              required={kind === "question"}
              placeholder={kind === "question" ? "e.g. Can I pay the equity in 36 months instead?" : "e.g. Can I visit the site this Saturday?"}
              className={field}
            />
          </label>
          {state.error && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:col-span-2">{state.error}</p>}
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button type="submit" disabled={pending} className="inline-flex items-center gap-2 bg-[var(--accent)] px-6 py-3.5 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to {agentName.split(" ")[0]}
            </button>
            <p className="text-xs text-[#8a847a]">Your details go only to {agentName} and their realty.</p>
          </div>
        </form>
      )}
    </div>
  )
}
