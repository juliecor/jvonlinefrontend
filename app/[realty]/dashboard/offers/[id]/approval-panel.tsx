"use client"

import { useState, useTransition } from "react"
import { AlertCircle, BadgeCheck, Check, Clock, LoaderCircle, Pencil, RotateCcw, X } from "lucide-react"
import { php } from "@/lib/format"
import { type MilestoneInput, type ScheduleRow, pct } from "@/lib/schedule"
import { type MailState, decideTerms, resubmitTerms } from "../actions"
import { type TermRow, TermsEditor, rowsFrom, termsTotal, toMilestones } from "../terms-editor"

type Props = {
  slug: string
  offerId: number
  status: "pending" | "approved" | "rejected"
  isStaff: boolean
  canEdit: boolean
  agent: string | null
  reason: string | null
  note: string | null
  approvedBy: string | null
  approvedAt: string | null
  price: number
  projectName: string | null
  schedule: ScheduleRow[]
  customMilestones: MilestoneInput[]
  officialPlans: { name: string; schedule: ScheduleRow[] }[]
}

const date = (ymd: string | null | undefined) => (ymd ? new Date(ymd.length === 10 ? `${ymd}T00:00:00+08:00` : ymd).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "")

/** Custom terms on one offer: the admin approves or sends back; the agent edits and resubmits. */
export function ApprovalPanel(p: Props) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<MailState>({})
  const [mode, setMode] = useState<"idle" | "reject" | "edit">(p.status === "rejected" && p.canEdit && !p.isStaff ? "edit" : "idle")
  const [note, setNote] = useState("")
  const [savePlan, setSavePlan] = useState(false)
  const [planName, setPlanName] = useState("")
  const [rows, setRows] = useState<TermRow[]>(() => rowsFrom(p.customMilestones, p.price))
  const [reason, setReason] = useState(p.reason ?? "")
  const [compare, setCompare] = useState(0)
  const official = p.officialPlans[compare]
  const termsOk = rows.length > 0 && Math.abs(termsTotal(rows) - p.price) < 0.01 && rows.every((r) => r.label.trim() && Number(r.amount) > 0)

  const decide = (decision: "approve" | "reject") =>
    start(async () => {
      const r = await decideTerms(p.slug, p.offerId, decision, note, decision === "approve" && savePlan ? planName.trim() : null)
      setMsg(r)
      if (!r.error) setMode("idle")
    })
  const resubmit = () =>
    start(async () => {
      const r = await resubmitTerms(p.slug, p.offerId, toMilestones(rows, p.price), reason)
      setMsg(r)
      if (!r.error) setMode("idle")
    })

  const tone = p.status === "pending" ? "border-amber-300 bg-amber-50" : p.status === "rejected" ? "border-red-300 bg-red-50" : "border-emerald-200 bg-emerald-50"
  const Icon = p.status === "pending" ? Clock : p.status === "rejected" ? AlertCircle : BadgeCheck

  if (p.status === "approved" && mode !== "edit") {
    return (
      <div className={`mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border px-4 py-3 text-sm ${tone}`}>
        <BadgeCheck className="h-4 w-4 text-emerald-700" />
        <span className="font-bold text-emerald-800">Custom terms, approved</span>
        <span className="text-[#5a554d]">{[p.approvedBy && `by ${p.approvedBy}`, p.approvedAt && date(p.approvedAt)].filter(Boolean).join(" · ")}</span>
        {msg.ok && <span className="font-semibold text-emerald-800">{msg.ok}</span>}
      </div>
    )
  }

  return (
    <section className={`mt-8 border-2 p-5 sm:p-6 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon className={`mt-1 h-5 w-5 shrink-0 ${p.status === "pending" ? "text-amber-700" : "text-red-700"}`} />
          <div>
            <p className="text-xl font-bold tracking-tight">
              {p.status === "pending" ? (p.isStaff ? "Custom terms: waiting for your approval" : "Waiting for approval") : "Sent back for changes"}
            </p>
            <p className="mt-1 text-sm text-[#3d3a34]">
              {p.status === "pending"
                ? p.isStaff
                  ? `${p.agent ?? "The agent"} made their own payment terms. The buyer can't open the offer until you approve them.`
                  : "Your realty's admins have your custom terms. The buyer can open the offer once they approve them; you'll get an email."
                : p.isStaff
                  ? `Waiting for ${p.agent ?? "the agent"} to change the terms and send them again.`
                  : "Change the terms below and send them for approval again."}
            </p>
          </div>
        </div>
      </div>

      {p.reason && (
        <p className="mt-4 border-l-4 border-[#17150f]/30 bg-white/70 px-4 py-2.5 text-[15px]">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b665d]">{p.agent ?? "Agent"}&apos;s note · </span>
          {p.reason}
        </p>
      )}
      {p.status === "rejected" && p.note && (
        <p className="mt-3 border-l-4 border-red-500 bg-white px-4 py-2.5 text-[15px] font-semibold text-red-800">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-red-700">{p.approvedBy ?? "Admin"} · </span>
          {p.note}
        </p>
      )}

      {mode === "edit" ? (
        <div className="mt-5 space-y-4">
          <TermsEditor rows={rows} setRows={setRows} price={p.price} />
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b665d]">Note for the approver</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} className="block w-full border border-[#d9d4cb] bg-white px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending || !termsOk} onClick={resubmit} className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} {p.isStaff ? "Save terms" : "Send for approval again"}
            </button>
            {p.status !== "rejected" && (
              <button type="button" onClick={() => setMode("idle")} className="px-3 py-3 text-sm font-semibold text-[#6b665d] hover:text-[#17150f]">
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`mt-5 grid gap-4 ${official && p.isStaff ? "lg:grid-cols-2" : ""}`}>
          <ScheduleBox title="Custom terms" rows={p.schedule} strong />
          {official && p.isStaff && (
            <div>
              <ScheduleBox title={`Official plan · ${official.name}`} rows={official.schedule} />
              {p.officialPlans.length > 1 && (
                <select value={compare} onChange={(e) => setCompare(Number(e.target.value))} aria-label="Compare with" className="mt-2 w-full border border-[#d9d4cb] bg-white px-3 py-2 text-sm">
                  {p.officialPlans.map((o, i) => (
                    <option key={o.name} value={i}>
                      Compare with: {o.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin's decision */}
      {p.isStaff && p.status === "pending" && mode !== "edit" && (
        <div className="mt-5 border-t border-amber-300 pt-5">
          {mode === "reject" ? (
            <div className="space-y-3">
              <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="What should the agent change? e.g. Equity can be 24 months at most" className="block w-full border border-[#d9d4cb] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-red-400" />
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending || !note.trim()} onClick={() => decide("reject")} className="inline-flex items-center gap-2 bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">
                  {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Send back to {p.agent?.split(" ")[0] ?? "the agent"}
                </button>
                <button type="button" onClick={() => setMode("idle")} className="inline-flex items-center gap-1 px-3 py-3 text-sm font-semibold text-[#6b665d] hover:text-[#17150f]">
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                <input type="checkbox" checked={savePlan} onChange={(e) => setSavePlan(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                Also save these terms as an official plan for {p.projectName ?? "this project"}
              </label>
              {savePlan && (
                <input value={planName} onChange={(e) => setPlanName(e.target.value)} maxLength={120} placeholder="Plan name, e.g. 12-month equity, balance via Pag-IBIG" className="block w-full max-w-md border border-[#d9d4cb] bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending || (savePlan && !planName.trim())} onClick={() => decide("approve")} className="inline-flex items-center gap-2 bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                  {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />} Approve
                </button>
                <button type="button" disabled={pending} onClick={() => setMode("reject")} className="inline-flex items-center gap-2 border border-[#d9d4cb] bg-white px-5 py-3 text-sm font-bold text-[#17150f] hover:border-red-400 hover:text-red-700">
                  <RotateCcw className="h-4 w-4" /> Send back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Agent (or admin) changing the terms */}
      {p.canEdit && mode === "idle" && (p.status === "pending" || (p.status === "rejected" && p.isStaff)) && (
        <button type="button" onClick={() => setMode("edit")} className="mt-4 inline-flex items-center gap-2 border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
          <Pencil className="h-4 w-4" /> Edit terms
        </button>
      )}

      {msg.ok && <p className="mt-4 text-sm font-bold text-emerald-800">{msg.ok}</p>}
      {msg.error && <p className="mt-4 text-sm font-bold text-red-700">{msg.error}</p>}
    </section>
  )
}

function ScheduleBox({ title, rows, strong = false }: { title: string; rows: ScheduleRow[]; strong?: boolean }) {
  return (
    <div className={`border bg-white ${strong ? "border-[#17150f]" : "border-[#e0dcd5]"}`}>
      <p className="border-b border-[#e6e2db] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#5a554d]">{title}</p>
      <ul className="divide-y divide-[#ebe7e1] text-sm">
        {rows.map((r, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
            <span className="min-w-0">
              <span className="font-semibold">{r.label}</span>
              <span className="block text-xs text-[#8a847a]">
                {pct(r.percent)} · {r.months && r.end_date ? `${r.months} × ${php(r.monthly)}, ${date(r.date)} – ${date(r.end_date)}` : r.date ? date(r.date) : "On completion"}
              </span>
            </span>
            <span className="shrink-0 font-bold tabular-nums">{php(r.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
