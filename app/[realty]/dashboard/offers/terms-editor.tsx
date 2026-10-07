"use client"

import { Plus, Trash2 } from "lucide-react"
import { php } from "@/lib/format"
import type { MilestoneInput } from "@/lib/schedule"

/**
 * Custom payment terms for one offer, typed the way agents talk: pesos, not
 * percentages. "Due" is days after the purchase date (blank = on completion);
 * "Monthly" spreads that payment over that many months.
 */

export type TermRow = { id: number; label: string; amount: string; days: string; months: string }

let nextId = 1
export const termRow = (label = "", amount = "", days = "", months = ""): TermRow => ({ id: nextId++, label, amount, days, months })

const peso = (n: number) => String(Math.round(n * 100) / 100)

/** Start from a plan the agent already knows (or a simple three-step template). */
export function rowsFrom(milestones: MilestoneInput[] | undefined, price: number): TermRow[] {
  if (!milestones?.length || !price) return [termRow("Reservation fee", price ? "20000" : "", "0"), termRow("Equity, monthly", price ? peso(price * 0.1 - 20000) : "", "30", "12"), termRow("Balance via Pag-IBIG or bank", price ? peso(price * 0.9) : "", "")]
  return milestones.map((m) => termRow(m.label, peso((price * m.percent) / 100), m.days === null ? "" : String(m.days), m.months ? String(m.months) : ""))
}

/** Pesos → the percentages Laravel stores (with enough decimals that ₱20,000 stays ₱20,000.00). */
export function toMilestones(rows: TermRow[], price: number): MilestoneInput[] {
  return rows.map((r) => ({
    label: r.label.trim(),
    percent: price ? (Number(r.amount) / price) * 100 : 0,
    days: r.days.trim() === "" ? null : Number(r.days),
    months: Number(r.months) >= 2 ? Number(r.months) : null,
  }))
}

export const termsTotal = (rows: TermRow[]) => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)

const input = "block w-full border border-[#d9d4cb] bg-white px-3 py-2.5 text-[15px] text-[#17150f] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const label = "mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b665d]"

export function TermsEditor({ rows, setRows, price }: { rows: TermRow[]; setRows: (fn: (rs: TermRow[]) => TermRow[]) => void; price: number }) {
  const total = termsTotal(rows)
  const diff = Math.round((price - total) * 100) / 100
  const update = (id: number, patch: Partial<TermRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div className="space-y-3">
      {rows.map((r, i) => {
        const months = Number(r.months)
        return (
          <div key={r.id} className="grid gap-3 border border-[#e0dcd5] bg-white p-3 sm:grid-cols-[1.5fr_1fr_0.9fr_0.8fr_auto] sm:items-end">
            <label className="block">
              <span className={label}>Payment {i + 1}</span>
              <input value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} required placeholder="e.g. Reservation fee" className={input} />
            </label>
            <label className="block">
              <span className={label}>Amount (₱)</span>
              <input type="number" min="0.01" step="0.01" inputMode="decimal" value={r.amount} onChange={(e) => update(r.id, { amount: e.target.value })} required className={`${input} tabular-nums`} />
            </label>
            <label className="block">
              <span className={label}>Due (days after)</span>
              <input type="number" min="0" value={r.days} onChange={(e) => update(r.id, { days: e.target.value })} placeholder="on completion" className={input} />
            </label>
            <label className="block">
              <span className={label}>Monthly ×</span>
              <input type="number" min="1" max="120" value={r.months} onChange={(e) => update(r.id, { months: e.target.value })} placeholder="once" className={input} />
            </label>
            <button
              type="button"
              aria-label={`Remove payment ${i + 1}`}
              disabled={rows.length === 1}
              onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
              className="flex h-[46px] w-full items-center justify-center text-[#a39d92] hover:bg-[#f6f4f0] hover:text-red-700 disabled:opacity-30 sm:w-11"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {months >= 2 && Number(r.amount) > 0 && (
              <p className="text-xs font-semibold text-[#5a554d] sm:col-span-5">
                {months} payments of about {php(Math.floor((Number(r.amount) / months) * 100) / 100)} a month{r.days.trim() === "" ? ", from completion" : `, the first ${r.days === "0" ? "on the purchase date" : `${r.days} days after purchase`}`}
              </p>
            )}
          </div>
        )
      })}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setRows((rs) => [...rs, termRow()])} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-3 py-2 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
          <Plus className="h-4 w-4" /> Add payment
        </button>
        <span className={`text-sm font-bold ${Math.abs(diff) < 0.01 ? "text-emerald-700" : "text-amber-700"}`}>
          {Math.abs(diff) < 0.01 ? `Adds up to the price, ${php(price)} ✓` : diff > 0 ? `${php(diff)} still to assign (of ${php(price)})` : `${php(-diff)} more than the price`}
        </span>
        {Math.abs(diff) >= 0.01 && rows.length > 0 && Number(rows[rows.length - 1].amount) + diff > 0 && (
          <button
            type="button"
            onClick={() => setRows((rs) => rs.map((r, i) => (i === rs.length - 1 ? { ...r, amount: peso(Number(r.amount || 0) + diff) } : r)))}
            className="text-sm font-bold text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Fix it in the last payment
          </button>
        )}
      </div>
    </div>
  )
}
