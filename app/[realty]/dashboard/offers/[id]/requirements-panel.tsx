"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { AlertCircle, CheckCircle2, ExternalLink, FileText, IdCard, LoaderCircle, Mail, Paperclip, Send, Undo2, User, X } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { type Requirement, STATE_LABEL, fileSize } from "@/lib/requirements-types"
import { longDate } from "@/lib/format"
import { type MailState, emailOffer, remindBuyer, reviewDocument } from "../actions"

/** Status pill: a dot plus a word, tinted by state. */
const STATE_STYLE = {
  missing: "border-red-200 bg-red-50 text-red-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
} as const
const DOT = { missing: "bg-red-600", review: "bg-amber-500", approved: "bg-emerald-600", rejected: "bg-red-600" } as const

function StatusPill({ state }: { state: Requirement["state"] }) {
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-2 border px-2.5 text-xs font-bold ${STATE_STYLE[state]}`}>
      <span className={`h-1.5 w-1.5 ${DOT[state]}`} />
      {state === "rejected" ? "Needs re-upload" : STATE_LABEL[state]}
    </span>
  )
}

/** A required item the buyer still has to send (or send again). */
const stillNeeded = (r: Requirement) => r.needed === "required" && (r.state === "missing" || r.state === "rejected")

/** An ID-type requirement gets the card icon; everything else a document. */
const isIdDoc = (name: string) => /\bid\b|passport|license|umid|sss/i.test(name)

const CARD = "border bg-white px-5 py-5 transition-colors"
/** Picked from the "Still missing" chips: that card's border turns red. */
const picking = (on: boolean) => (on ? "border-red-500 ring-4 ring-red-200 shadow-[0_0_0_10px_rgba(239,68,68,0.12)]" : "border-[#e0dcd5]")

/** Each requirement with the buyer's files: preview, open, approve or send back with a reason. */
export function RequirementsPanel({ slug, offerId, requirements, detailsSentAt, canReview = true }: { slug: string; offerId: number; requirements: Requirement[]; detailsSentAt: string | null; canReview?: boolean }) {
  const shown = requirements.filter((r) => r.needed !== "not_needed" || r.files.length > 0)
  const skipped = requirements.length - shown.length
  const needed = [...(detailsSentAt ? [] : [{ key: "details", name: "Buyer details" }]), ...shown.filter(stillNeeded).map((r) => ({ key: `req-${r.id}`, name: r.name }))]
  const toReview = shown.filter((r) => r.state === "review").length
  const [picked, setPicked] = useState<string | null>(null)
  const rowId = (key: string) => `requirement-${key}`
  const jump = (key: string) => {
    setPicked(key)
    document.getElementById(rowId(key))?.scrollIntoView({ behavior: "smooth", block: "center" })
  }
  return (
    <div className="space-y-4 pt-5">
      {needed.length > 0 ? (
        <div className="flex gap-4 border border-red-200 border-l-4 border-l-red-500 bg-red-50 px-5 py-4">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-red-600 text-white">
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold text-red-800">Still missing · {needed.length} {needed.length === 1 ? "item" : "items"}</p>
            <p className="mt-0.5 text-sm text-[#6b665d]">Complete the following requirements to proceed.</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {needed.map((n) => (
                <li key={n.key}>
                  <button type="button" onClick={() => jump(n.key)} className={`border bg-white px-3.5 py-1.5 text-sm font-bold text-red-700 transition hover:border-red-500 ${picked === n.key ? "border-red-500" : "border-red-200"}`}>
                    {n.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 border border-emerald-200 border-l-4 border-l-emerald-600 bg-emerald-50 px-5 py-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-emerald-600 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <p className="text-lg font-bold text-emerald-800">Nothing missing. {toReview ? `${toReview} to review.` : "Every required item is in."}</p>
        </div>
      )}

      {/* The buyer form comes first: the list of files depends on what they answered. */}
      <div id={rowId("details")} className={`${CARD} ${picking(picked === "details")}`}>
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#f6f4f0] text-[#17150f]">
            <User className="h-6 w-6" />
          </span>
          <div className="flex min-h-14 min-w-0 flex-1 flex-col justify-between">
            <p className="line-clamp-2 text-lg font-bold leading-7">Buyer details</p>
            <div>
              <StatusPill state={detailsSentAt ? "approved" : "missing"} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#6b665d]">{detailsSentAt ? `Sent ${longDate(detailsSentAt)} · with Data Privacy consent` : "Not sent yet. The buyer fills these in on the offer page."}</p>
      </div>

      {shown.map((r) => (
        <RequirementRow key={r.id} id={rowId(`req-${r.id}`)} slug={slug} offerId={offerId} req={r} canReview={canReview} picked={picked === `req-${r.id}`} />
      ))}
      {skipped > 0 && <p className="pt-1 text-sm text-[#8a847a]">{skipped} item{skipped === 1 ? "" : "s"} on your list {skipped === 1 ? "doesn't" : "don't"} apply to this buyer, going by their details.</p>}
    </div>
  )
}

function RequirementRow({ id, slug, offerId, req, canReview, picked }: { id: string; slug: string; offerId: number; req: Requirement; canReview: boolean; picked: boolean }) {
  const required = req.needed === "required"
  // The title is at most two lines (28px each, the icon's height). When it needs both,
  // the tag moves out from under it to below the icon.
  const titleRef = useRef<HTMLParagraphElement>(null)
  const [twoLines, setTwoLines] = useState(false)
  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setTwoLines(el.getBoundingClientRect().height > 40))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const tag = (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex h-7 items-center border px-2.5 text-xs font-bold ${required ? "border-[var(--accent)] text-[var(--accent)]" : "border-[#e6e2db] text-[#6b665d]"}`}>
        {required ? "Required" : req.needed === "optional" ? "If Applicable" : "Not Needed for This Buyer"}
      </span>
      <StatusPill state={req.state} />
    </div>
  )
  return (
    <div id={id} className={`${CARD} ${picking(picked)}`}>
      <div className="flex gap-4">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center bg-[#f6f4f0] ${required ? "text-[var(--accent)]" : "text-[#6b665d]"}`}>
          {isIdDoc(req.name) ? <IdCard className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
        </span>
        <div className="flex min-h-14 min-w-0 flex-1 flex-col justify-between">
          <p ref={titleRef} className="line-clamp-2 text-lg font-bold leading-7">
            {req.name}
          </p>
          {!twoLines && tag}
        </div>
      </div>
      {twoLines && <div className="mt-3">{tag}</div>}
      {req.state === "rejected" && req.note && (
        <p className="mt-3 border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-red-700">Asked to fix · </span>
          {req.note}
        </p>
      )}
      {req.help && <p className="mt-3 text-sm text-[#6b665d]">{req.help}</p>}
      {req.files.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {req.files.map((f) => (
            <FileCard key={f.id} slug={slug} offerId={offerId} file={f} canReview={canReview} />
          ))}
        </ul>
      )}
      {req.files.length === 0 && (
        <p className="mt-3 inline-flex h-7 items-center gap-2 whitespace-nowrap border border-dashed border-[#d9d4cb] bg-[#f6f4f0] px-2.5 text-xs font-bold text-[#8a847a]">
          <Paperclip className="h-3.5 w-3.5" /> Nothing uploaded yet.
        </p>
      )}
    </div>
  )
}

function FileCard({ slug, offerId, file, canReview }: { slug: string; offerId: number; file: Requirement["files"][number]; canReview: boolean }) {
  const [pending, start] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState("")
  const [msg, setMsg] = useState<MailState>({})
  const url = `/${slug}/dashboard/offers/${offerId}/documents/${file.id}`
  const image = file.mime?.startsWith("image/") && !/hei[cf]/.test(file.mime)
  const act = (status: "approved" | "rejected" | "pending", n?: string) =>
    start(async () => {
      const r = await reviewDocument(slug, offerId, file.id, status, n)
      setMsg(r)
      if (!r.error) setRejecting(false)
    })

  return (
    <li className={`flex flex-col border bg-white ${file.status === "rejected" ? "border-red-200" : file.status === "approved" ? "border-emerald-200" : "border-amber-300"}`}>
      <a href={url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 p-3">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-16 w-20 shrink-0 border border-[#e6e2db] bg-[#f6f4f0] object-cover" />
        ) : (
          <span className="flex h-16 w-20 shrink-0 items-center justify-center border border-[#e6e2db] bg-[#f6f4f0] text-[#8a847a]">
            <FileText className="h-6 w-6" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-bold group-hover:text-[var(--accent)]">
            <span className="truncate">{file.name}</span> <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </span>
          <span className="mt-0.5 block text-xs text-[#8a847a]">
            {fileSize(file.size)} · sent {new Date(file.uploaded_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
          </span>
          {file.status !== "pending" && file.reviewed_by && (
            <span className="mt-0.5 block text-xs text-[#8a847a]">
              {file.status === "approved" ? "Approved" : "Re-upload requested"} by {file.reviewed_by}
            </span>
          )}
        </span>
      </a>
      {file.status === "rejected" && file.note && <p className="mx-3 mb-3 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">Reason: {file.note}</p>}

      {canReview && (
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[#ebe7e1] px-3 py-2.5">
        {file.status === "pending" && !rejecting && (
          <>
            <button type="button" disabled={pending} onClick={() => act("approved")} className="inline-flex items-center gap-1.5 bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
              {pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />} Approve
            </button>
            <button type="button" disabled={pending} onClick={() => setRejecting(true)} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] px-3 py-2 text-xs font-bold text-[#17150f] hover:border-red-400 hover:text-red-700">
              Request re-upload
            </button>
          </>
        )}
        {file.status !== "pending" && (
          <button type="button" disabled={pending} onClick={() => act("pending")} className="inline-flex items-center gap-1.5 px-1 py-1 text-xs font-semibold text-[#8a847a] hover:text-[#17150f]">
            {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />} Undo
          </button>
        )}
        {rejecting && (
          <form
            className="flex w-full flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              act("rejected", note)
            }}
          >
            <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} required maxLength={300} placeholder="What should they fix? e.g. The photo is blurry" className="w-full border border-[#d9d4cb] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-60">
                {pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />} Request re-upload
              </button>
              <button type="button" onClick={() => setRejecting(false)} className="inline-flex items-center gap-1 px-2 py-2 text-xs font-semibold text-[#8a847a] hover:text-[#17150f]">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </form>
        )}
        {msg.error && <p className="w-full text-xs font-semibold text-red-700">{msg.error}</p>}
      </div>
      )}
    </li>
  )
}

/** Getting the buyer to finish: email the offer, email a reminder, or copy one for Viber. */
export function FollowUp({
  slug,
  offerId,
  email,
  emailedAt,
  remindedAt,
  reminders,
  viberText,
  active,
  nothingMissing,
}: {
  slug: string
  offerId: number
  email: string | null
  emailedAt: string | null
  remindedAt: string | null
  reminders: number
  viberText: string
  active: boolean
  nothingMissing: boolean
}) {
  const [pending, start] = useTransition()
  const [which, setWhich] = useState<"offer" | "remind" | null>(null)
  const [msg, setMsg] = useState<MailState>({})
  const run = (kind: "offer" | "remind") => {
    setWhich(kind)
    setMsg({})
    start(async () => setMsg(await (kind === "offer" ? emailOffer(slug, offerId) : remindBuyer(slug, offerId))))
  }
  const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }) : null)
  const btn = "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition disabled:opacity-50"

  return (
    <div className="border border-[#e0dcd5] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b665d]">Follow up</p>
      <p className="mt-1 text-sm text-[#5a554d]">{email ? <>Emails go to <strong className="text-[#17150f]">{email}</strong>.</> : "No email for this buyer yet. Copy the reminder and send it by Viber or text."}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={!active || !email || nothingMissing || pending} onClick={() => run("remind")} className={`${btn} bg-[var(--accent)] text-white hover:brightness-110`}>
          {pending && which === "remind" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Email a reminder
        </button>
        <button type="button" disabled={!active || !email || pending} onClick={() => run("offer")} className={`${btn} border border-[#d9d4cb] text-[#17150f] hover:border-[#17150f]`}>
          {pending && which === "offer" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} {emailedAt ? "Email the offer again" : "Email the offer"}
        </button>
        {!nothingMissing && <CopyButton text={viberText} label="Copy reminder for Viber" className="!rounded-none !px-4 !py-2.5 !text-sm" />}
      </div>
      {msg.ok && <p className="mt-3 text-sm font-semibold text-emerald-700">{msg.ok}</p>}
      {msg.error && <p className="mt-3 text-sm font-semibold text-red-700">{msg.error}</p>}
      <p className="mt-3 text-xs text-[#8a847a]">
        {nothingMissing ? "Every required item is in. " : ""}
        Offer emailed: {when(emailedAt) ?? "not yet"} · Reminders: {reminders ? `${reminders}, last ${when(remindedAt)}` : "none yet"}
      </p>
    </div>
  )
}
