"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowRight, Check, FilePlus2, LoaderCircle, ShieldCheck, Wallet } from "lucide-react"
import { php } from "@/lib/format"
import { confirmReservation } from "../offers/actions"
import type { ActionCard as ActionCardData } from "./actions"

/**
 * What the AI set up for the person to do with one press: confirm a buyer's waiting reservation (the lot
 * turns reserved and the buyer is emailed), or open the New offer form with the lot, buyer and fee typed in.
 * Nothing happens until the button is pressed.
 */
export function ActionCard({ slug, card }: { slug: string; card: ActionCardData }) {
  if (card.kind === "confirm_reservation") return <ConfirmReservation slug={slug} card={card} />
  return <NewOffer slug={slug} card={card} />
}

function ConfirmReservation({ slug, card }: { slug: string; card: Extract<ActionCardData, { kind: "confirm_reservation" }> }) {
  const [state, setState] = useState<{ done?: string; error?: string }>(card.status === "confirmed" ? { done: "Already confirmed: the lot is reserved for the buyer." } : {})
  const [pending, start] = useTransition()
  const confirm = () =>
    start(async () => {
      const r = await confirmReservation(slug, card.offer.id)
      if (r.error) return setState({ error: r.error })
      setState({ done: r.emailed ? `Reserved for ${card.offer.buyer}. They were emailed at ${r.emailed}.` : `Reserved for ${card.offer.buyer}. They have no email on file, so tell them yourself.` })
    })
  return (
    <div className="mt-4 border-2 border-[var(--accent)] bg-white p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
        <Wallet className="h-4 w-4" /> Confirm reservation
      </p>
      <p className="mt-2 text-lg font-bold text-[#17150f]">
        {card.offer.buyer} · {card.offer.unit}
      </p>
      <p className="text-sm text-[#5a554d]">
        {card.offer.project} · {php(card.fee)} · {card.how}
        {card.reference ? ` · ref ${card.reference}` : ""}
      </p>
      {state.done ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={3} /> {state.done}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-[#6b665d]">Pressing Confirm marks {card.offer.unit} reserved for {card.offer.buyer} and emails them. Open the receipt first if you haven&apos;t.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {card.can_confirm && (
              <button type="button" onClick={confirm} disabled={pending} className="inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60">
                {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Confirm reservation
              </button>
            )}
            <Link href={`/${slug}/dashboard/offers/${card.offer.id}`} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
              Open the offer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
      {state.error && <p className="mt-2 text-sm font-bold text-red-700">{state.error}</p>}
    </div>
  )
}

function NewOffer({ slug, card }: { slug: string; card: Extract<ActionCardData, { kind: "new_offer" }> }) {
  const q = new URLSearchParams({ project: String(card.project.id), unit: String(card.unit.id) })
  if (card.buyer) q.set("buyer", card.buyer)
  if (card.email) q.set("email", card.email)
  if (card.phone) q.set("phone", card.phone)
  if (card.fee) q.set("fee", String(card.fee))
  return (
    <div className="mt-4 border-2 border-[var(--accent)] bg-white p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
        <FilePlus2 className="h-4 w-4" /> New offer, filled in
      </p>
      <p className="mt-2 text-lg font-bold text-[#17150f]">
        {card.unit.name}
        {card.project.name ? ` · ${card.project.name}` : ""}
      </p>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
        <dt className="text-[#8a847a]">Price</dt>
        <dd className="font-semibold">{card.price === null ? "Not priced yet" : php(card.price)}</dd>
        <dt className="text-[#8a847a]">Buyer</dt>
        <dd className="font-semibold">{card.buyer ?? <span className="font-normal text-[#8a847a]">to type in</span>}</dd>
        {(card.email || card.phone) && (
          <>
            <dt className="text-[#8a847a]">Contact</dt>
            <dd className="font-semibold">{[card.email, card.phone].filter(Boolean).join(" · ")}</dd>
          </>
        )}
        <dt className="text-[#8a847a]">Reservation fee</dt>
        <dd className="font-semibold">{card.fee ? php(card.fee) : <span className="font-normal text-[#8a847a]">none</span>}</dd>
      </dl>
      {card.can_offer ? (
        <>
          <p className="mt-2 text-sm text-[#6b665d]">Opens the New offer form with this typed in. Pick the payment terms, press the password&apos;s refresh button, check everything, then create the offer link.</p>
          <Link href={`/${slug}/dashboard/offers/new?${q}`} className="mt-3 inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110">
            <FilePlus2 className="h-4 w-4" /> Open New offer
          </Link>
        </>
      ) : (
        <p className="mt-2 text-sm font-semibold text-amber-800">{card.unit.status !== "available" ? `This lot is ${card.unit.status} now.` : "This lot can't be offered yet (no price, or the project is archived)."}</p>
      )}
    </div>
  )
}
