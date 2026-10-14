"use client"

import { useState, useTransition } from "react"
import { AlertCircle, Check, CheckCircle2, Clock, CreditCard, ExternalLink, Landmark, LoaderCircle, ShieldCheck, Wallet } from "lucide-react"
import { php, shortDate } from "@/lib/format"
import { type ReservationInfo, confirmReservation, declineReservation } from "../actions"

/**
 * The buyer's reservation on this offer: the fee, how they paid (online or with a proof the team can
 * open), and for the developer's admins the Confirm button (the unit turns reserved) or a send-back.
 */
export function ReservationPanel({ slug, offerId, initial, canSettle, buyerFirst }: { slug: string; offerId: number; initial: ReservationInfo; canSettle: boolean; buyerFirst: string }) {
  const [r, setR] = useState(initial)
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({})
  const [declining, setDeclining] = useState(false)
  const [note, setNote] = useState("")
  const [pending, start] = useTransition()

  const confirm = () =>
    start(async () => {
      const got = await confirmReservation(slug, offerId)
      if (got.error) return setMsg({ error: got.error })
      if (got.reservation) setR(got.reservation)
      setMsg({ ok: got.emailed ? `Reserved. ${buyerFirst} was emailed at ${got.emailed}.` : "Reserved. The buyer has no email on file, so tell them yourself." })
    })
  const decline = () =>
    start(async () => {
      const got = await declineReservation(slug, offerId, note.trim())
      if (got.error) return setMsg({ error: got.error })
      if (got.reservation) setR(got.reservation)
      setDeclining(false)
      setMsg({ ok: got.emailed ? `Sent back. ${buyerFirst} was emailed.` : "Sent back." })
    })

  const state =
    r.status === "confirmed"
      ? { icon: ShieldCheck, cls: "text-emerald-700", text: `Confirmed${r.confirmed_by ? ` by ${r.confirmed_by}` : ""}${r.confirmed_at ? ` · ${shortDate(r.confirmed_at)}` : ""}` }
      : r.status === "paid"
        ? { icon: CheckCircle2, cls: "text-emerald-700", text: `Paid online${r.paid_at ? ` · ${shortDate(r.paid_at)}` : ""} · waiting for your confirmation` }
        : r.status === "pending" && r.method === "proof"
          ? { icon: Clock, cls: "text-amber-700", text: `Proof sent${r.requested_at ? ` · ${shortDate(r.requested_at)}` : ""} · waiting for your confirmation` }
          : r.status === "pending"
            ? { icon: Clock, cls: "text-[#8a847a]", text: "Started paying online, not finished" }
            : r.status === "declined"
              ? { icon: AlertCircle, cls: "text-red-700", text: "Sent back to the buyer" }
              : { icon: Wallet, cls: "text-[#8a847a]", text: "The buyer hasn't paid yet" }
  const Icon = state.icon
  const waiting = r.status === "pending" || r.status === "paid"

  return (
    <section className="h-full border border-[#e6e2db] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#17150f]">
          <Wallet className="h-4 w-4 text-[var(--accent)]" /> Reservation
        </p>
        <span className="text-sm font-semibold">
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-[#6b665d]">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Saving
            </span>
          ) : msg.ok ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <Check className="h-4 w-4" strokeWidth={3} /> {msg.ok}
            </span>
          ) : null}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-2xl font-bold tabular-nums">{php(r.fee)}</p>
        <p className={`inline-flex items-center gap-1.5 text-sm font-semibold ${state.cls}`}>
          <Icon className="h-4 w-4" /> {state.text}
        </p>
      </div>
      {(r.reference || r.note || r.has_proof) && (
        <dl className="mt-3 space-y-1 text-sm">
          {r.method && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-[#8a847a]">Paid by</dt>
              <dd className="inline-flex items-center gap-1.5 font-medium">{r.method === "online" ? <><CreditCard className="h-3.5 w-3.5" /> Online (PayMongo)</> : <><Landmark className="h-3.5 w-3.5" /> Bank / GCash</>}</dd>
            </div>
          )}
          {r.reference && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-[#8a847a]">Reference</dt>
              <dd className="font-mono font-medium">{r.reference}</dd>
            </div>
          )}
          {r.note && r.status !== "declined" && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-[#8a847a]">Buyer says</dt>
              <dd>{r.note}</dd>
            </div>
          )}
          {r.note && r.status === "declined" && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-[#8a847a]">Sent back</dt>
              <dd>{r.note}</dd>
            </div>
          )}
          {r.has_proof && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-[#8a847a]">Proof</dt>
              <dd>
                <a href={`/${slug}/dashboard/offers/${offerId}/reservation-proof`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline">
                  Open the receipt <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </dd>
            </div>
          )}
        </dl>
      )}
      {msg.error && <p className="mt-3 text-sm font-bold text-red-700">{msg.error}</p>}

      {canSettle && waiting && !declining && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={confirm} disabled={pending} className="inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" /> Confirm reservation
          </button>
          <button type="button" onClick={() => setDeclining(true)} disabled={pending} className="inline-flex items-center border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-red-400 hover:text-red-700 disabled:opacity-60">
            Send back
          </button>
        </div>
      )}
      {canSettle && waiting && declining && (
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            decline()
          }}
        >
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b665d]">Tell the buyer why</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} required maxLength={500} placeholder="e.g. The receipt is blurry, please send a clearer photo." className="mt-1.5 block w-full border border-[#d9d4cb] px-3.5 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={pending || !note.trim()} className="bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60">
              Send back to the buyer
            </button>
            <button type="button" onClick={() => setDeclining(false)} className="px-3 py-2.5 text-sm font-semibold text-[#8a847a] hover:text-[#17150f]">
              Cancel
            </button>
          </div>
        </form>
      )}
      {!canSettle && waiting && <p className="mt-3 text-sm text-[#6b665d]">Johndorf&apos;s admins check the payment and confirm the reservation.</p>}
      {r.status === null && <p className="mt-3 text-sm text-[#6b665d]">The buyer pays this on their offer page{r.online ? ", online or" : ""} by bank deposit or GCash, and uploads the proof.</p>}
    </section>
  )
}
