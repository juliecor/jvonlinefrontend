"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { BadgeCheck, Clock, ExternalLink, LoaderCircle, Send } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { Alert, Label, fieldClass } from "@/components/form"
import { php, sqm } from "@/lib/format"
import { buildSchedule, pct } from "@/lib/schedule"
import type { ProjectDetail } from "../projects/types"
import { type OfferState, createOffer } from "./actions"
import { type TermRow, TermsEditor, rowsFrom, termsTotal, toMilestones } from "./terms-editor"

/**
 * Project → unit → plan → buyer. The plan is one of the project's official
 * plans, or the agent's own custom terms, which a realty admin approves
 * before the buyer can open the offer. Shows the computed schedule before sending.
 */
export function OfferForm({ slug, projects, initialProject, today, isStaff, realtyName }: { slug: string; projects: ProjectDetail[]; initialProject?: number; today: string; isStaff: boolean; realtyName: string }) {
  const [state, setState] = useState<OfferState>({})
  const [pending, start] = useTransition()
  const [projectId, setProjectId] = useState<number>(initialProject ?? projects[0]?.id ?? 0)
  const project = projects.find((p) => p.id === projectId)
  // Only what can actually be offered: available, and with a price.
  const units = useMemo(() => (project?.units ?? []).filter((u) => u.status === "available" && u.price !== null), [project])
  const [unitId, setUnitId] = useState<number>(0)
  const unit = units.find((u) => u.id === unitId) ?? units[0]
  const price = Number(unit?.price ?? 0)
  const [planId, setPlanId] = useState<number | "custom" | "">("")
  const custom = planId === "custom"
  const plan = custom ? undefined : (project?.payment_plans.find((p) => p.id === planId) ?? project?.payment_plans[0])
  const [rows, setRows] = useState<TermRow[]>([])
  const [date, setDate] = useState(today)

  const chooseTerms = (v: string) => {
    if (v === "custom") {
      // Start from the plan the agent was looking at, in pesos.
      setRows(rowsFrom(plan?.milestones, price))
      setPlanId("custom")
    } else setPlanId(v ? Number(v) : "")
  }

  // The same arithmetic Laravel does, so the preview matches the offer.
  const milestones = custom ? toMilestones(rows, price) : (plan?.milestones ?? [{ label: "Full payment", percent: 100, days: 0 }])
  const preview = unit && date ? buildSchedule(price, milestones, date, project?.completion_date ?? null) : []
  const termsOk = !custom || (rows.length > 0 && Math.abs(termsTotal(rows) - price) < 0.01 && rows.every((r) => r.label.trim() && Number(r.amount) > 0))

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (custom) fd.set("custom_milestones", JSON.stringify(milestones))
    start(async () => setState(await createOffer(slug, {}, fd)))
  }

  if (state.id && state.approval === "pending") {
    return (
      <div className="border border-amber-300 bg-amber-50 p-6">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-amber-800">
          <Clock className="h-4 w-4" /> Sent for approval
        </p>
        <p className="mt-2 text-lg font-bold text-[#17150f]">Your custom terms are with {realtyName}&apos;s admins.</p>
        <p className="mt-1 text-sm text-[#5a554d]">You&apos;ll get an email when they approve them. Until then the buyer can&apos;t open the link{state.emailOnApproval ? "; it will be emailed to them as soon as it's approved" : ""}.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/${slug}/dashboard/offers/${state.id}`} className="inline-flex items-center bg-[#17150f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3d3a34]">
            Track this offer
          </Link>
          <Link href={`/${slug}/dashboard/offers`} className="inline-flex items-center border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
            All offers
          </Link>
        </div>
      </div>
    )
  }

  if (state.url) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Offer ready</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{state.emailed ? `Emailed to ${state.emailed}` : "Send this link to the buyer"}</p>
        {state.emailed && <p className="mt-1 text-sm text-slate-600">You can also copy the link below and send it by Viber or text.</p>}
        <p className="mt-3 break-all rounded-lg border border-emerald-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-800">{state.url}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton text={state.url} className="bg-white" />
          <a href={state.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900">
            Open <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Link href={state.id ? `/${slug}/dashboard/offers/${state.id}` : `/${slug}/dashboard/offers`} className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
            Track this offer
          </Link>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return <Alert kind="error">There are no projects with units yet. Add a project and a unit first.</Alert>
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label>Project</Label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(Number(e.target.value))
                setUnitId(0)
                setPlanId("")
              }}
              className={fieldClass}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <Label>Unit (available, with a price)</Label>
            <select name="unit_id" value={unit?.id ?? ""} onChange={(e) => setUnitId(Number(e.target.value))} required className={fieldClass}>
              {units.length === 0 && <option value="">No available priced units</option>}
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.unit_type && u.unit_type !== u.name ? ` · ${u.unit_type}` : ""} · {php(u.price)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <Label>Payment terms</Label>
          <select name="payment_plan_id" value={custom ? "custom" : (plan?.id ?? "")} onChange={(e) => chooseTerms(e.target.value)} className={fieldClass}>
            {(project?.payment_plans.length ?? 0) > 0 && (
              <optgroup label={`${project?.name}'s plans`}>
                {project?.payment_plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            )}
            {(project?.payment_plans.length ?? 0) === 0 && <option value="">Full payment on the purchase date</option>}
            <option value="custom">{isStaff ? "Custom terms for this buyer…" : "Custom terms for this buyer (needs approval)…"}</option>
          </select>
        </label>

        {custom && (
          <div className="space-y-4 border-l-4 border-[var(--accent)] bg-[#fbfaf8] p-4">
            <div className="flex items-start gap-2.5 text-sm text-[#3d3a34]">
              {isStaff ? <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />}
              <p>
                {isStaff
                  ? "You're an admin, so your custom terms are approved right away."
                  : `Custom terms need approval from ${realtyName}'s admins. The buyer can open the offer once it's approved, and you'll get an email.`}{" "}
                The project&apos;s own plans don&apos;t change.
              </p>
            </div>
            <TermsEditor rows={rows} setRows={setRows} price={price} />
            {!isStaff && (
              <label className="block">
                <Label>Note for the approver (optional)</Label>
                <textarea name="approval_reason" rows={2} maxLength={500} placeholder="e.g. The buyer can pay the equity in 12 months, not 24." className={fieldClass} />
              </label>
            )}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label>Buyer&apos;s name</Label>
            <input name="buyer_name" required placeholder="Full name" className={fieldClass} />
          </label>
          <label className="block">
            <Label>Buyer&apos;s mobile (optional)</Label>
            <input name="buyer_phone" type="tel" placeholder="09XX XXX XXXX" className={fieldClass} />
          </label>
          <label className="block sm:col-span-2">
            <Label>Buyer&apos;s email (optional)</Label>
            <input name="buyer_email" type="email" placeholder="buyer@example.com" className={fieldClass} />
            <span className="mt-1 block text-xs text-slate-500">Needed to email the offer and requirement reminders.</span>
          </label>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
          <input type="checkbox" name="email_buyer" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
          {custom && !isStaff ? "Email the offer to the buyer once it's approved (if you entered their email)" : "Email the offer to the buyer now (if you entered their email)"}
        </label>
        <label className="block sm:max-w-xs">
          <Label>Purchase / reservation date</Label>
          <input name="purchase_date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </label>
        {state.error && <Alert kind="error">{state.error}</Alert>}
        <button type="submit" disabled={pending || !unit || !termsOk} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {custom && !isStaff ? "Send for approval" : "Create offer link"}
        </button>
        {custom && !termsOk && <p className="text-xs font-semibold text-amber-700">The payments need a name and an amount each, and must add up to the price.</p>}
      </div>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:sticky lg:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Preview{custom ? " · custom terms" : ""}</p>
        {unit ? (
          <>
            <p className="mt-3 text-lg font-semibold">{unit.name}</p>
            <p className="text-sm text-slate-500">{[project?.name, unit.unit_type !== unit.name ? unit.unit_type : null, unit.floor, unit.area_sqm ? sqm(unit.area_sqm) : null].filter(Boolean).join(" · ")}</p>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{php(unit.price)}</p>
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-slate-200">
                {preview.map((m, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2">
                      <p className="font-medium">{m.label || "—"}</p>
                      <p className="text-xs text-slate-500">{m.months && m.end_date ? `${m.months} × ${php(m.monthly)} · ${fmt(m.date)} – ${fmt(m.end_date)}` : m.date ? fmt(m.date) : "On completion"}</p>
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">{pct(m.percent)}</td>
                    <td className="py-2 pl-3 text-right font-medium tabular-nums">{php(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Pick a project with an available unit.</p>
        )}
      </aside>
    </form>
  )
}

const fmt = (ymd: string | null | undefined) => (ymd ? new Date(`${ymd}T00:00:00+08:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "")
