"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { AlertCircle, Camera, CheckCircle2, Clock, CreditCard, Landmark, LoaderCircle, ShieldCheck } from "lucide-react"
import { php } from "@/lib/format"
import { type Reservation, reservationStatus, startReservationCheckout, uploadReservationProof } from "./actions"

const input = "mt-1.5 block w-full border border-[#d9d4cb] bg-white px-3.5 py-3 text-[15px] text-[#17150f] outline-none transition placeholder:text-[#b3ada3] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const label = "text-xs font-bold uppercase tracking-[0.1em] text-[#5a554d]"

/**
 * "Reserve this home" on the buyer's offer: the fee the agent set, paid online (when the developer has
 * PayMongo) or by bank deposit / GCash with a photo of the proof. The developer's admins confirm it,
 * which holds the home for this buyer.
 */
export function ReserveSection({ code, initial, unitName, sellerName, backFromPayment }: { code: string; initial: Reservation; unitName: string; sellerName: string; backFromPayment: boolean }) {
  const [r, setR] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  // Back from PayMongo: ask where it stands (the webhook may still be on its way), a few times if needed.
  const [checks, setChecks] = useState(backFromPayment && initial.status === "pending" && initial.method === "online" ? 1 : 0)
  useEffect(() => {
    if (!checks) return
    const t = setTimeout(async () => {
      const got = await reservationStatus(code)
      if (got.reservation) setR(got.reservation)
      setChecks((n) => (got.reservation?.status === "pending" && n < 5 ? n + 1 : 0))
    }, 2500)
    return () => clearTimeout(t)
  }, [checks, code])

  const payOnline = () =>
    start(async () => {
      setError(null)
      const got = await startReservationCheckout(code)
      if (got.error || !got.url) return setError(got.error ?? "The payment page could not be opened.")
      window.location.assign(got.url)
    })

  const sendProof = (fd: FormData) =>
    start(async () => {
      setError(null)
      const got = await uploadReservationProof(code, fd)
      if (got.error) return setError(got.error)
      if (got.reservation) setR(got.reservation)
      setFileName(null)
    })

  const fee = php(r.fee)

  if (r.status === "confirmed") {
    return (
      <div className="flex items-start gap-4 border-2 border-emerald-600 bg-white p-6 sm:p-8">
        <ShieldCheck className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" />
        <div>
          <p className="text-2xl font-bold tracking-tight">{unitName} is reserved for you.</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#3d3a34]">
            {sellerName} received your reservation fee of <b>{fee}</b>
            {r.confirmed_at ? ` and confirmed it on ${new Date(r.confirmed_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}` : ""}. The payment schedule above runs from here.
          </p>
        </div>
      </div>
    )
  }

  const waiting = r.status === "paid" || (r.status === "pending" && (r.method === "proof" || checks > 0))

  return (
    <div className="space-y-5">
      {/* Where it stands */}
      {waiting ? (
        <div className="flex items-start gap-4 border-2 border-amber-400 bg-amber-50 p-5 sm:p-6">
          {checks > 0 ? <LoaderCircle className="mt-0.5 h-6 w-6 shrink-0 animate-spin text-amber-700" /> : <Clock className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />}
          <div>
            <p className="text-lg font-bold text-amber-900">
              {r.status === "paid" ? `Paid ${fee}. ${sellerName} is confirming your reservation.` : checks > 0 ? "Checking your payment…" : `Your proof of payment is with ${sellerName}.`}
            </p>
            <p className="mt-1 text-[15px] text-amber-900/80">
              {r.status === "paid" ? "You'll get an email once it's confirmed, and this page will say the home is reserved for you." : checks > 0 ? "One moment while the payment comes through." : "They check it and confirm the reservation, usually within a working day. You'll get an email."}
              {r.reference && (
                <>
                  {" "}
                  Reference: <span className="font-mono font-semibold">{r.reference}</span>.
                </>
              )}
            </p>
          </div>
        </div>
      ) : r.status === "declined" ? (
        <div className="flex items-start gap-4 border-2 border-red-400 bg-red-50 p-5 sm:p-6">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />
          <div>
            <p className="text-lg font-bold text-red-900">{sellerName} could not confirm your payment yet.</p>
            {r.note && <p className="mt-1 text-[15px] text-red-900/80">They said: {r.note}</p>}
            <p className="mt-1 text-[15px] text-red-900/80">Please send a clearer proof below, or pay again.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-4 border border-[#e0dcd5] bg-white p-5 sm:p-6">
          <div>
            <p className={label}>Reservation fee</p>
            <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">{fee}</p>
          </div>
          <p className="max-w-sm text-[15px] text-[#5a554d]">Pay it to hold {unitName} for you. Once {sellerName} confirms, the home is reserved in your name.</p>
        </div>
      )}

      {/* How to pay */}
      {!waiting && (
        <div className={`grid gap-4 ${r.online ? "lg:grid-cols-2" : ""}`}>
          {r.online && (
            <section className="border-2 border-[var(--accent)] bg-white p-5 sm:p-6">
              <p className="flex items-center gap-2 text-lg font-bold">
                <CreditCard className="h-5 w-5 text-[var(--accent)]" /> Pay online
              </p>
              <p className="mt-1 text-[15px] text-[#5a554d]">GCash, Maya or a card, on a secure page. You come straight back here once it&apos;s paid.</p>
              <button type="button" onClick={payOnline} disabled={pending} className="mt-4 inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3.5 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
                {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pay {fee} now
              </button>
            </section>
          )}
          <section className="border border-[#e0dcd5] bg-white p-5 sm:p-6">
            <p className="flex items-center gap-2 text-lg font-bold">
              <Landmark className="h-5 w-5 text-[var(--accent)]" /> {r.online ? "Or pay by bank deposit or GCash" : "Pay by bank deposit or GCash"}
            </p>
            {r.instructions ? (
              <pre className="mt-3 whitespace-pre-wrap border-l-4 border-[var(--accent)] bg-[#faf8f5] px-4 py-3 font-sans text-[15px] leading-relaxed text-[#17150f]">{r.instructions}</pre>
            ) : (
              <p className="mt-1 text-[15px] text-[#5a554d]">Ask {sellerName} for the account to pay into, then upload your receipt here.</p>
            )}
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                sendProof(new FormData(e.currentTarget))
              }}
            >
              <label className={`flex cursor-pointer items-center gap-3 border-2 border-dashed px-4 py-4 text-sm font-bold transition ${fileName ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-[#d9d4cb] text-[#17150f] hover:border-[#17150f]"}`}>
                {fileName ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <Camera className="h-5 w-5 shrink-0" />}
                <span className="min-w-0 flex-1 truncate">{fileName ?? "Photo or PDF of your receipt"}</span>
                <input ref={fileRef} name="proof" type="file" accept="image/*,application/pdf" required className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={label}>Reference number (optional)</span>
                  <input name="reference" maxLength={120} placeholder="GCash or bank reference" className={input} />
                </label>
                <label className="block">
                  <span className={label}>Note (optional)</span>
                  <input name="note" maxLength={1000} placeholder="e.g. Paid at BPI Matina" className={input} />
                </label>
              </div>
              <button type="submit" disabled={pending || !fileName} className="inline-flex items-center gap-2 bg-[#17150f] px-5 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#3d3a34] disabled:opacity-60">
                {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Send proof of payment
              </button>
              <p className="text-xs text-[#8a847a]">Photo or PDF, up to 10 MB. Make sure the amount, date and reference are readable.</p>
            </form>
          </section>
        </div>
      )}
      {waiting && r.method === "proof" && (
        <details className="border border-[#e0dcd5] bg-white p-5">
          <summary className="cursor-pointer text-sm font-bold text-[#3d3a34]">Sent the wrong file? Send another</summary>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              sendProof(new FormData(e.currentTarget))
            }}
          >
            <input name="proof" type="file" accept="image/*,application/pdf" required className="block text-sm" />
            <input name="reference" maxLength={120} placeholder="Reference number (optional)" className={input} />
            <button type="submit" disabled={pending} className="inline-flex items-center gap-2 border border-[#17150f] px-4 py-2.5 text-sm font-bold text-[#17150f] disabled:opacity-60">
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null} Replace the proof
            </button>
          </form>
        </details>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
