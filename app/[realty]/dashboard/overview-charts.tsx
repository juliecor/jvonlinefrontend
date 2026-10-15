"use client"

import { useState } from "react"

/** The site map's status colours, so the numbers read the same as the lots. */
export const STATUS = { available: "#10b981", reserved: "#f59e0b", sold: "#dc2626" } as const
const INK = "#3d3a34"

export type TrendMonth = { month: string; label: string; offers: number; reserved: number; sold: number }

/**
 * Six months side by side: offers sent (dark) and homes reserved or sold through them (stacked amber and
 * red). One scale, a recessive grid, a legend, and the month's numbers on hover or tap.
 */
export function TrendChart({ months }: { months: TrendMonth[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...months.map((m) => Math.max(m.offers, m.reserved + m.sold)))
  const top = niceMax(max)
  const ticks = [0, top / 2, top]
  const shown = hover === null ? months.length - 1 : hover
  const m = months[shown]

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#5a554d]">
        <Key color={INK} label="Offers sent" />
        <Key color={STATUS.reserved} label="Reserved" />
        <Key color={STATUS.sold} label="Sold" />
      </div>
      <div className="relative mt-4 flex h-52 gap-2">
        {/* the scale */}
        <div className="flex w-6 shrink-0 flex-col-reverse justify-between pb-6 text-right text-[11px] tabular-nums text-[#a39d92]">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 bottom-6 top-0 flex flex-col-reverse justify-between">
            {ticks.map((t) => (
              <span key={t} className="border-t border-[#efece7]" />
            ))}
          </div>
          <div className="relative flex h-full items-end gap-2 sm:gap-3">
            {months.map((mo, i) => {
              const on = shown === i
              return (
                <button
                  key={mo.month}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onClick={() => setHover(i)}
                  aria-label={`${mo.label}: ${mo.offers} offers sent, ${mo.reserved} reserved, ${mo.sold} sold`}
                  className="group flex h-full min-w-0 flex-1 flex-col justify-end outline-none"
                >
                  <div className="flex h-[calc(100%-1.5rem)] items-end justify-center gap-1 px-0.5">
                    <span className="w-1/2 max-w-7 transition-opacity" style={{ height: `${(mo.offers / top) * 100}%`, minHeight: mo.offers ? 3 : 0, background: INK, opacity: on ? 1 : 0.55 }} />
                    <span className="flex w-1/2 max-w-7 flex-col-reverse transition-opacity" style={{ height: `${((mo.reserved + mo.sold) / top) * 100}%`, opacity: on ? 1 : 0.55 }}>
                      <span style={{ height: `${mo.reserved + mo.sold ? (mo.reserved / (mo.reserved + mo.sold)) * 100 : 0}%`, minHeight: mo.reserved ? 3 : 0, background: STATUS.reserved }} />
                      <span style={{ height: `${mo.reserved + mo.sold ? (mo.sold / (mo.reserved + mo.sold)) * 100 : 0}%`, minHeight: mo.sold ? 3 : 0, background: STATUS.sold }} />
                    </span>
                  </div>
                  <span className={`mt-2 h-4 text-center text-xs ${on ? "font-bold text-[#17150f]" : "text-[#8a847a]"}`}>{mo.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <p className="mt-3 border-t border-[#efece7] pt-3 text-sm text-[#5a554d]">
        <b className="text-[#17150f]">{monthName(m.month)}</b>: {m.offers} offer{m.offers === 1 ? "" : "s"} sent · {m.reserved} reserved · {m.sold} sold
      </p>
    </div>
  )
}

/** Every unit and lot by status, as a ring with the share available in the middle. */
export function InventoryRing({ available, reserved, sold }: { available: number; reserved: number; sold: number }) {
  const [hover, setHover] = useState<keyof typeof STATUS | null>(null)
  const total = available + reserved + sold
  const parts = [
    { key: "available" as const, label: "Available", n: available },
    { key: "reserved" as const, label: "Reserved", n: reserved },
    { key: "sold" as const, label: "Sold", n: sold },
  ]
  const r = 42
  const c = 2 * Math.PI * r
  let run = 0
  const focus = hover ? parts.find((p) => p.key === hover)! : parts[0]
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`${available} available, ${reserved} reserved, ${sold} sold`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f1eee9" strokeWidth="12" />
          {total > 0 &&
            parts.map((p) => {
              // A part too small to see still shows as a sliver.
              const len = p.n ? Math.max((p.n / total) * c, 1.6) : 0
              const el = (
                <circle
                  key={p.key}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={STATUS[p.key]}
                  strokeWidth={hover === p.key ? 14 : 12}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-run}
                  onMouseEnter={() => setHover(p.key)}
                  onMouseLeave={() => setHover(null)}
                  className="cursor-default transition-[stroke-width]"
                />
              )
              run += len
              return el
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[family-name:var(--font-outfit),var(--font-geist-sans)] text-[26px] font-bold tabular-nums text-[#17150f]">{total ? share(focus.n, total) : "—"}</span>
          <span className="text-xs text-[#6b665d]">{focus.label.toLowerCase()}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {parts.map((p) => (
          <li key={p.key} onMouseEnter={() => setHover(p.key)} onMouseLeave={() => setHover(null)} className="flex items-center justify-between gap-3 text-[15px]">
            <Key color={STATUS[p.key]} label={p.label} />
            <span className="font-bold tabular-nums text-[#17150f]">{p.n.toLocaleString("en-PH")}</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 border-t border-[#efece7] pt-2.5 text-sm text-[#6b665d]">
          <span>Total units and lots</span>
          <span className="font-semibold tabular-nums">{total.toLocaleString("en-PH")}</span>
        </li>
      </ul>
    </div>
  )
}

/** How far buyers get: each step as a bar against the offers sent, with the share that made it. */
export function Funnel({ steps }: { steps: { step: string; n: number }[] }) {
  const first = Math.max(1, steps[0]?.n ?? 0)
  return (
    <ol className="space-y-3.5">
      {steps.map((s, i) => {
        const share = Math.round((s.n / first) * 100)
        const last = i === steps.length - 1
        return (
          <li key={s.step}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-[#17150f]">{s.step}</span>
              <span className="tabular-nums text-[#6b665d]">
                <b className="text-[#17150f]">{s.n.toLocaleString("en-PH")}</b>
                {i > 0 && <span className="ml-1.5 text-xs">{share}%</span>}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#f1eee9]">
              <div className="h-full rounded-full transition-[width]" style={{ width: `${s.n ? Math.max((s.n / first) * 100, 1.5) : 0}%`, background: last ? STATUS.available : i === 0 ? INK : "var(--accent)" }} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** One project's lots as a stacked bar: available, reserved, sold. */
export function StackBar({ available, reserved, sold }: { available: number; reserved: number; sold: number }) {
  const total = Math.max(1, available + reserved + sold)
  return (
    <div className="flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-[#f1eee9]" title={`${available} available · ${reserved} reserved · ${sold} sold`}>
      {[
        [available, STATUS.available],
        [reserved, STATUS.reserved],
        [sold, STATUS.sold],
      ].map(([n, color], i) => (Number(n) ? <span key={i} style={{ width: `${Math.max((Number(n) / total) * 100, 1)}%`, background: String(color) }} /> : null))}
    </div>
  )
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

/** "99.9%", never a rounded-up 100% while something is left, nor 0% when there is some. */
function share(n: number, total: number) {
  const pct = Math.round((n / total) * 1000) / 10
  if (pct >= 100 && n < total) return "99.9%"
  if (pct <= 0 && n > 0) return "<0.1%"
  return `${pct}%`
}

/** A round top for the scale with a whole-number middle: an even number up to 10, else 2, 5 or 10 times a power of ten. */
function niceMax(n: number) {
  if (n <= 10) return Math.max(2, Math.ceil(n / 2) * 2)
  const p = 10 ** Math.floor(Math.log10(n))
  const f = n / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p
}

const monthName = (ym: string) => new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })
