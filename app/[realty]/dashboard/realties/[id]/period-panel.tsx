"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Ban, CalendarClock, Check, ExternalLink, FileCheck2, LoaderCircle, Printer, RotateCw, Undo2 } from "lucide-react"
import { Panel, Tag } from "@/components/dashboard-ui"
import { toast } from "@/components/feedback"
import { Modal } from "@/components/modal"
import { longDate, shortDate } from "@/lib/format"
import { checkSignedCopy, endAccreditation, renewAccreditation } from "../actions"
import { PERIOD_TAG, type Period } from "../period"
import { type Term, TermChoice, lastDay } from "../term-choice"

/** The day after `iso` (YYYY-MM-DD). */
const nextDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * An accepted realty's accreditation period: how long it runs, renew or extend it
 * (renewing early adds the time after the current end, so no days are lost), or end
 * it now with a reason. Then the signed and notarized agreement it uploads: open it,
 * accept it, or send it back with what to fix.
 */
export function PeriodPanel({ slug, id, firm, period, today, agreed, printable }: { slug: string; id: number; firm: string; period: Period; today: string; agreed: { name: string; at: string } | null; printable: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [dialog, setDialog] = useState<"renew" | "end" | null>(null)
  const [term, setTerm] = useState<Term>({ term: "1y", until: "" })
  const [note, setNote] = useState("")
  const [sendBack, setSendBack] = useState(false)
  const [returnNote, setReturnNote] = useState("")
  const [error, setError] = useState<string>()

  const p = period
  const running = p.state === "active" || p.state === "ending"
  // Renewing while it still runs continues from the day after its end; otherwise it starts today.
  const base = running && p.until && p.until >= today ? nextDay(p.until) : today
  const newEnd = lastDay(term, base)
  const copy = p.signed_copy

  const close = () => {
    setDialog(null)
    setError(undefined)
  }
  const run = (task: () => Promise<{ error?: string }>, done: string, after?: () => void) =>
    start(async () => {
      const r = await task()
      if (r.error) {
        setError(r.error)
        toast(r.error, "error")
        return
      }
      setError(undefined)
      toast(done)
      after?.()
      router.refresh()
    })

  const headline = {
    active: `Accredited until ${longDate(p.until)}`,
    ending: `Ends ${p.days_left === 0 ? "today" : `in ${p.days_left} day${p.days_left === 1 ? "" : "s"}`} · ${longDate(p.until)}`,
    expired: `Expired · the last day was ${longDate(p.until)}`,
    ended: `Ended early on ${longDate(p.ended_at)}`,
    open: "Accredited · no end date set",
  }[p.state]

  return (
    <>
      <Panel title="Accreditation period" aside={<Tag tone={PERIOD_TAG[p.state].tone}>{PERIOD_TAG[p.state].label}</Tag>}>
        <div className="pt-5">
          <p className={`text-2xl font-bold tracking-tight ${p.state === "expired" || p.state === "ended" ? "text-red-800" : p.state === "ending" ? "text-amber-800" : "text-[#17150f]"}`}>{headline}</p>
          <p className="mt-1 text-[15px] text-[#5a554d]">
            {p.from ? `Started ${longDate(p.from)}` : "Accepted before accreditations had an end date."}
            {p.state === "open" && " Set an end date to start the reminders."}
          </p>
          {(p.state === "expired" || p.state === "ended") && (
            <p className="mt-3 border-l-4 border-red-600 bg-red-50 px-4 py-2.5 text-[15px] font-semibold text-red-800">{firm} can&apos;t make new offers. Offers they already made carry on.</p>
          )}
          {p.state === "ended" && p.end_note && <p className="mt-2 text-[15px] text-[#3d3a34]">Why: &ldquo;{p.end_note}&rdquo;</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setDialog("renew")} className="inline-flex items-center gap-1.5 bg-[#17150f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3d3a34]">
              <RotateCw className="h-4 w-4" /> {p.state === "open" ? "Set an end date" : running ? "Extend or renew" : "Renew"}
            </button>
            {(running || p.state === "open") && (
              <button type="button" onClick={() => setDialog("end")} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-red-400 hover:text-red-700">
                <Ban className="h-4 w-4" /> End now
              </button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Signed agreement" aside="Printed, signed on every page, notarized and uploaded by the realty">
        <div className="space-y-4 pt-5">
          <p className="text-[15px] text-[#3d3a34]">
            {agreed ? (
              <>
                Agreed online by <strong>{agreed.name}</strong> on {longDate(agreed.at)}.
              </>
            ) : (
              "Not agreed online: the form was sent before the agreement was set up."
            )}
          </p>

          {copy.status === "submitted" && (
            <div className="border-2 border-sky-200 bg-sky-50 p-4">
              <p className="flex items-center gap-2 text-lg font-bold text-sky-950">
                <FileCheck2 className="h-5 w-5" /> Uploaded {shortDate(copy.uploaded_at)} · check it
              </p>
              <p className="mt-1 text-sm text-sky-900">Every page signed by both sides and the witnesses, and notarized, with the dates {p.from && p.until ? `${shortDate(p.from)} to ${shortDate(p.until)}` : "on it"}.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {copy.document_id && <FileLink href={`/${slug}/dashboard/realties/${id}/documents/${copy.document_id}`} />}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => checkSignedCopy(slug, id, "verified"), "Signed agreement accepted")}
                  className="inline-flex items-center gap-1.5 bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />} It&apos;s right
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setSendBack((v) => !v)}
                  className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-red-400 hover:text-red-700"
                >
                  <Undo2 className="h-4 w-4" /> Send back
                </button>
              </div>
              {sendBack && (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(
                      () => checkSignedCopy(slug, id, "returned", returnNote),
                      "Sent back to the realty",
                      () => {
                        setSendBack(false)
                        setReturnNote("")
                      },
                    )
                  }}
                >
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]">What should they fix? (they see this)</span>
                    <textarea
                      autoFocus
                      required
                      rows={2}
                      maxLength={300}
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                      placeholder="e.g. Page 2 has no signature."
                      className="mt-1.5 block w-full border border-[#d9d4cb] bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]"
                    />
                  </label>
                  <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
                    {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Send back
                  </button>
                </form>
              )}
            </div>
          )}
          {copy.status === "verified" && (
            <div className="flex flex-wrap items-center gap-3">
              <Tag tone="good">Checked and accepted</Tag>
              {copy.document_id && <FileLink href={`/${slug}/dashboard/realties/${id}/documents/${copy.document_id}`} />}
            </div>
          )}
          {copy.status === "returned" && (
            <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5 text-[15px] text-amber-950">
              <strong>Sent back:</strong> &ldquo;{copy.note}&rdquo; Waiting for a new upload{copy.due ? `, due ${shortDate(copy.due)}` : ""}.
            </p>
          )}
          {(copy.status === "missing" || copy.status === null) && (
            <p className={`text-[15px] ${copy.overdue ? "font-bold text-red-700" : "text-[#5a554d]"}`}>
              {copy.overdue ? `Not uploaded yet: it was due ${longDate(copy.due)}.` : copy.due ? `Not uploaded yet · due ${longDate(copy.due)}.` : "Not uploaded yet."}
            </p>
          )}

          {printable && (
            <Link href={`/${slug}/agreement?form=${id}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] hover:underline">
              <Printer className="h-4 w-4" /> View or print their agreement
            </Link>
          )}
        </div>
      </Panel>

      <Modal open={dialog === "renew"} onClose={close} eyebrow="Accreditation" title={p.state === "open" ? `Set ${firm}'s end date` : `Renew ${firm}`}>
        <p className="text-[15px] text-[#5a554d]">{base === today ? "Counted from today." : `Counted from ${longDate(base)}, the day after it ends now, so no days are lost.`} The reminder goes out again 30 days before the new end.</p>
        <div className="mt-4">
          <TermChoice value={term} onChange={setTerm} from={base} today={today} />
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !newEnd}
            onClick={() => run(() => renewAccreditation(slug, id, term), `Accredited until ${shortDate(newEnd)}`, close)}
            className="inline-flex items-center gap-1.5 bg-[#17150f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3d3a34] disabled:opacity-60"
          >
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />} {newEnd ? `Accredit until ${shortDate(newEnd)}` : "Pick a date"}
          </button>
          <button type="button" onClick={close} className="px-3 py-2.5 text-sm font-semibold text-[#8a847a] hover:text-[#17150f]">
            Cancel
          </button>
        </div>
      </Modal>

      <Modal open={dialog === "end"} onClose={close} eyebrow="Accreditation" title={`End ${firm}'s accreditation now?`}>
        <p className="text-[15px] text-[#5a554d]">From today they can&apos;t make new offers. Offers they already made carry on. You can renew it later.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () => endAccreditation(slug, id, note),
              "Accreditation ended",
              () => {
                close()
                setNote("")
              },
            )
          }}
        >
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]">Why? (kept on record, and they see it)</span>
            <textarea
              autoFocus
              required
              rows={3}
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Advertised our projects without approval."
              className="mt-1.5 block w-full border border-[#d9d4cb] bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]"
            />
          </label>
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} End accreditation now
            </button>
            <button type="button" onClick={close} className="px-3 py-2.5 text-sm font-semibold text-[#8a847a] hover:text-[#17150f]">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function FileLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border border-[#17150f] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:bg-[#f6f4f0]">
      <ExternalLink className="h-4 w-4" /> Open the file
    </a>
  )
}
