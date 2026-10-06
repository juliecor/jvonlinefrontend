import Link from "next/link"

/**
 * The realty dashboard's building blocks. One look for every realty, tinted by
 * its own brand colour (--accent, set on the shell) — hairlines and type, not
 * a grid of identical cards.
 */

/** Headline type for the dashboard: the site sans, bold — no serif, no italics. */
export const display = "font-sans font-bold"

export function PageHeader({ eyebrow, title, lede, action }: { eyebrow?: string; title: string; lede?: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-[#e6e2db] pb-6">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{eyebrow}</p>}
        <h1 className={`${display} mt-2 text-3xl tracking-tight text-[#17150f] sm:text-4xl`}>{title}</h1>
        {lede && <p className="mt-2 max-w-2xl text-[15px] text-[#5a554d]">{lede}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  )
}

/** A row of big numbers separated by hairlines — the dashboard's ledger line. */
export function Ledger({ items }: { items: { label: string; value: string | number; note?: string; href?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 divide-[#e6e2db] border-b border-[#e6e2db] sm:flex sm:divide-x">
      {items.map((it) => {
        const body = (
          <>
            <dt className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b665d]">{it.label}</dt>
            <dd className={`${display} mt-2 text-4xl tabular-nums tracking-tight text-[#17150f] sm:text-[2.75rem]`}>{typeof it.value === "number" ? it.value.toLocaleString("en-PH") : it.value}</dd>
            {it.note && <dd className="mt-1 text-sm text-[#6b665d]">{it.note}</dd>}
          </>
        )
        const cls = "py-6 pr-6 sm:flex-1 sm:px-6 sm:first:pl-0 sm:last:pr-0"
        return it.href ? (
          <Link key={it.label} href={it.href} className={`${cls} group transition hover:text-[var(--accent)]`}>
            {body}
          </Link>
        ) : (
          <div key={it.label} className={cls}>
            {body}
          </div>
        )
      })}
    </dl>
  )
}

/** A section with a small-caps title and a hairline — lists and forms live inside. */
export function Panel({ title, aside, children, className = "" }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`mt-10 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#17150f] pb-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#17150f]">{title}</h2>
        {aside && <div className="text-xs text-[#8a847a]">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

/** Row list: hairlines between rows, no boxes. */
export function Rows({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-[#e6e2db]">{children}</ul>
}

export function Row({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <li className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${muted ? "opacity-60" : ""}`}>{children}</li>
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-[#8a847a]">{children}</p>
}

export function Tag({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad" | "accent"; children: React.ReactNode }) {
  const tones = {
    neutral: "border-[#e6e2db] text-[#6b665d]",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    bad: "border-red-200 bg-red-50 text-red-700",
    accent: "border-[var(--accent)] text-[var(--accent)]",
  }
  return <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${tones[tone]}`}>{children}</span>
}

export const btn = {
  primary: "inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60",
  ghost: "inline-flex items-center justify-center gap-1.5 rounded-md border border-[#d9d4cb] bg-white px-3 py-2 text-xs font-semibold text-[#17150f] transition hover:border-[#17150f] disabled:opacity-60",
}

export const field = "mt-1.5 block w-full rounded-md border border-[#d9d4cb] bg-white px-3.5 py-2.5 text-[15px] text-[#17150f] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 disabled:bg-[#f6f4f0] disabled:text-[#8a847a]"
