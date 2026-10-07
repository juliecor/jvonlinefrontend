"use client"

import { useState, useTransition } from "react"
import { AlertCircle, Check, CheckCircle2, Clock, ExternalLink, FileText, LoaderCircle, Mail, RotateCcw, Send, Undo2, X } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { type Requirement, STATE_LABEL, fileSize } from "@/lib/requirements-types"
import { type MailState, emailOffer, remindBuyer, reviewDocument } from "../actions"

const STATE_STYLE = {
  missing: "border-[#d9d4cb] text-[#6b665d]",
  review: "border-amber-300 bg-amber-50 text-amber-800",
  approved: "border-emerald-300 bg-emerald-50 text-emerald-800",
  rejected: "border-red-300 bg-red-50 text-red-700",
} as const

const STATE_ICON = { missing: null, review: Clock, approved: CheckCircle2, rejected: AlertCircle } as const

/** Each requirement with the buyer's files: preview, open, approve or send back with a reason. */
export function RequirementsPanel({ slug, offerId, requirements }: { slug: string; offerId: number; requirements: Requirement[] }) {
  const shown = requirements.filter((r) => r.needed !== "not_needed" || r.files.length > 0)
  const skipped = requirements.length - shown.length
  return (
    <div>
      <ul className="divide-y divide-[#e6e2db]">
        {shown.map((r) => (
          <RequirementRow key={r.id} slug={slug} offerId={offerId} req={r} />
        ))}
      </ul>
      {skipped > 0 && <p className="pt-3 text-sm text-[#8a847a]">{skipped} item{skipped === 1 ? "" : "s"} on your list {skipped === 1 ? "doesn't" : "don't"} apply to this buyer, going by their details.</p>}
    </div>
  )
}

function RequirementRow({ slug, offerId, req }: { slug: string; offerId: number; req: Requirement }) {
  const Icon = STATE_ICON[req.state]
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold">{req.name}</p>
            <span className={`text-[11px] font-bold uppercase tracking-[0.12em] ${req.needed === "required" ? "text-[var(--accent)]" : "text-[#8a847a]"}`}>
              {req.needed === "required" ? "Required" : req.needed === "optional" ? "If applicable" : "Not needed for this buyer"}
            </span>
          </div>
          {req.help && <p className="mt-0.5 max-w-2xl text-sm text-[#6b665d]">{req.help}</p>}
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-xs font-bold ${STATE_STYLE[req.state]}`}>
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {req.state === "rejected" ? "Sent back" : STATE_LABEL[req.state]}
        </span>
      </div>
      {req.files.length === 0 ? (
        <p className="mt-3 text-sm font-semibold text-[#a39d92]">Nothing uploaded yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {req.files.map((f) => (
            <FileCard key={f.id} slug={slug} offerId={offerId} file={f} />
          ))}
        </ul>
      )}
    </li>
  )
}

function FileCard({ slug, offerId, file }: { slug: string; offerId: number; file: Requirement["files"][number] }) {
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
              {file.status === "approved" ? "Approved" : "Sent back"} by {file.reviewed_by}
            </span>
          )}
        </span>
      </a>
      {file.status === "rejected" && file.note && <p className="mx-3 mb-3 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">Reason: {file.note}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[#ebe7e1] px-3 py-2.5">
        {file.status === "pending" && !rejecting && (
          <>
            <button type="button" disabled={pending} onClick={() => act("approved")} className="inline-flex items-center gap-1.5 bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
              {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />} Approve
            </button>
            <button type="button" disabled={pending} onClick={() => setRejecting(true)} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] px-3 py-2 text-xs font-bold text-[#17150f] hover:border-red-400 hover:text-red-700">
              <RotateCcw className="h-3.5 w-3.5" /> Send back
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
                {pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />} Send back to buyer
              </button>
              <button type="button" onClick={() => setRejecting(false)} className="inline-flex items-center gap-1 px-2 py-2 text-xs font-semibold text-[#8a847a] hover:text-[#17150f]">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </form>
        )}
        {msg.error && <p className="w-full text-xs font-semibold text-red-700">{msg.error}</p>}
      </div>
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
