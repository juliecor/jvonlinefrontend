"use client"

import { useActionState, useMemo, useState } from "react"
import Link from "next/link"
import { ExternalLink, LoaderCircle, Send } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { Alert, Label, fieldClass } from "@/components/form"
import { php, sqm } from "@/lib/format"
import type { ProjectDetail } from "../projects/types"
import { type OfferState, createOffer } from "./actions"

// Plain calendar arithmetic on YYYY-MM-DD, no time zone involved (the server does the same with Carbon).
const addDays = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** Project → unit → plan → buyer. Shows the computed schedule before sending. */
export function OfferForm({ slug, projects, initialProject, today }: { slug: string; projects: ProjectDetail[]; initialProject?: number; today: string }) {
  const [state, submit, pending] = useActionState<OfferState, FormData>(createOffer.bind(null, slug), {})
  const [projectId, setProjectId] = useState<number>(initialProject ?? projects[0]?.id ?? 0)
  const project = projects.find((p) => p.id === projectId)
  const units = useMemo(() => (project?.units ?? []).filter((u) => u.status === "available"), [project])
  const [unitId, setUnitId] = useState<number>(0)
  const unit = units.find((u) => u.id === unitId) ?? units[0]
  const [planId, setPlanId] = useState<number | "">("")
  const plan = project?.payment_plans.find((p) => p.id === planId) ?? project?.payment_plans[0]
  const [date, setDate] = useState(today)

  // The same arithmetic Laravel does, so the preview matches the offer.
  const preview = useMemo(() => {
    if (!unit) return []
    const price = Number(unit.price)
    const ms = plan?.milestones ?? [{ label: "Full payment", percent: 100, days: 0 }]
    let running = 0
    return ms.map((m, i) => {
      const amount = i === ms.length - 1 ? Math.round((price - running) * 100) / 100 : Math.round(price * m.percent) / 100
      running += amount
      const d = m.days === null ? project?.completion_date ?? null : date ? addDays(date, m.days) : null
      return { ...m, amount, date: d }
    })
  }, [unit, plan, date, project])

  if (state.url) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Offer ready</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">Send this link to the buyer</p>
        <p className="mt-3 break-all rounded-lg border border-emerald-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-800">{state.url}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton text={state.url} className="bg-white" />
          <a href={state.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900">
            Open <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Link href={`/${slug}/dashboard/offers`} className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
            All offers
          </Link>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return <Alert kind="error">There are no projects with units yet. Add a project and a unit first.</Alert>
  }

  return (
    <form action={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label>Project</Label>
            <select value={projectId} onChange={(e) => { setProjectId(Number(e.target.value)); setUnitId(0); setPlanId("") }} className={fieldClass}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block">
            <Label>Unit (available only)</Label>
            <select name="unit_id" value={unit?.id ?? ""} onChange={(e) => setUnitId(Number(e.target.value))} required className={fieldClass}>
              {units.length === 0 && <option value="">No available units</option>}
              {units.map((u) => <option key={u.id} value={u.id}>{u.name}{u.unit_type ? ` · ${u.unit_type}` : ""} · {php(u.price)}</option>)}
            </select>
          </label>
        </div>
        <label className="block">
          <Label>Payment plan</Label>
          <select name="payment_plan_id" value={plan?.id ?? ""} onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : "")} className={fieldClass}>
            {(project?.payment_plans.length ?? 0) === 0 && <option value="">Full payment on the purchase date</option>}
            {project?.payment_plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label>Buyer&apos;s name</Label>
            <input name="buyer_name" required placeholder="Full name" className={fieldClass} />
          </label>
          <label className="block">
            <Label>Buyer&apos;s email (optional)</Label>
            <input name="buyer_email" type="email" placeholder="buyer@example.com" className={fieldClass} />
          </label>
        </div>
        <label className="block sm:max-w-xs">
          <Label>Purchase / reservation date</Label>
          <input name="purchase_date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </label>
        {state.error && <Alert kind="error">{state.error}</Alert>}
        <button type="submit" disabled={pending || !unit} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Create offer link
        </button>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Preview</p>
        {unit ? (
          <>
            <p className="mt-3 text-lg font-semibold">{unit.name}</p>
            <p className="text-sm text-slate-500">{[project?.name, unit.unit_type, unit.floor, unit.area_sqm ? sqm(unit.area_sqm) : null].filter(Boolean).join(" · ")}</p>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{php(unit.price)}</p>
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-slate-200">
                {preview.map((m, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2">
                      <p className="font-medium">{m.label}</p>
                      <p className="text-xs text-slate-500">{m.date ? new Date(`${m.date}T00:00:00+08:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "On completion"}</p>
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">{m.percent}%</td>
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
