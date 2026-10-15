"use client"

import { useState, useTransition } from "react"
import { Check, CreditCard, Landmark, LoaderCircle } from "lucide-react"
import { Panel } from "@/components/dashboard-ui"
import { saveReservationSettings } from "./actions"

/** Where buyers pay the reservation fee by bank or GCash: typed once here, shown on every offer with a fee. */
export function PaymentSettings({ slug, initial, online }: { slug: string; initial: string | null; online: boolean }) {
  const [value, setValue] = useState(initial ?? "")
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string }>({})
  const [pending, start] = useTransition()
  return (
    <Panel
      title="Reservation payment"
      aside={
        online ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
            <CreditCard className="h-4 w-4" /> Online payment is on (PayMongo)
          </span>
        ) : (
          "Buyers upload proof of a bank or GCash payment"
        )
      }
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          start(async () => {
            const r = await saveReservationSettings(slug, value)
            setMsg(r.error ? { error: r.error } : { ok: true })
          })
        }}
      >
        <p className="flex items-start gap-2 text-[15px] text-[#5a554d]">
          <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
          Where buyers send the reservation fee. Shown on their sales offer when it has a fee, exactly as typed here.
        </p>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={"e.g.\nBPI · Johndorf Ventures Corporation · 1234-5678-90\nGCash · 0917 000 0000 (Johndorf)"}
          className="block w-full rounded-xl border border-[#d9d4cb] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
        />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60">
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />} Save
          </button>
          {msg.ok && <span className="text-sm font-semibold text-emerald-700">Saved</span>}
          {msg.error && <span className="text-sm font-semibold text-red-700">{msg.error}</span>}
        </div>
        {!online && <p className="text-xs text-[#8a847a]">To let buyers pay online (GCash, Maya, cards), Johndorf signs up with PayMongo and the keys go in the server&apos;s settings. The Pay online button then appears by itself.</p>}
      </form>
    </Panel>
  )
}
