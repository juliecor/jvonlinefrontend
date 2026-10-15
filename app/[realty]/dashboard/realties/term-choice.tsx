"use client"

import { longDate } from "@/lib/format"

export type Term = { term: "1y" | "dec31" | "custom"; until: string }

/** The last day of a year that starts on `from` (YYYY-MM-DD): a year later, less a day, as Laravel counts it. */
export const yearFrom = (from: string) => {
  const [y, m, d] = from.split("-").map(Number)
  const end = new Date(Date.UTC(y + 1, m - 1, d))
  end.setUTCDate(end.getUTCDate() - 1)
  return end.toISOString().slice(0, 10)
}

/** The last day a choice gives, counted from `from`; null while no date is picked. */
export const lastDay = (t: Term, from: string) => (t.term === "1y" ? yearFrom(from) : t.term === "dec31" ? `${from.slice(0, 4)}-12-31` : t.until || null)

/**
 * How long an accreditation runs: a year, to December 31, or a day the admin
 * picks. `from` is where the time is counted from (today when accepting; the
 * day after the current end when renewing early), and each choice shows its date.
 */
export function TermChoice({ value, onChange, from, today }: { value: Term; onChange: (t: Term) => void; from: string; today: string }) {
  const options: { term: Term["term"]; label: string; note: string }[] = [
    { term: "1y", label: "1 year", note: `until ${longDate(yearFrom(from))}` },
    {
      term: "dec31",
      label: "Until December 31",
      note: longDate(`${from.slice(0, 4)}-12-31`),
    },
    { term: "custom", label: "Pick the last day", note: "any date from today" },
  ]

  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">How long the accreditation runs</legend>
      {options.map((o) => (
        <label
          key={o.term}
          className={`rounded-xl flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 border px-4 py-3 transition ${value.term === o.term ? "border-[var(--accent)] bg-white" : "border-[#d9d4cb] bg-white/60 hover:border-[#a39d92]"}`}
        >
          <input type="radio" name="term" checked={value.term === o.term} onChange={() => onChange({ ...value, term: o.term })} className="h-4 w-4 accent-[var(--accent)]" />
          <span className="text-[15px] font-bold">{o.label}</span>
          <span className="text-sm text-[#6b665d]">{o.note}</span>
          {o.term === "custom" && value.term === "custom" && (
            <input
              type="date"
              required
              min={today}
              value={value.until}
              onChange={(e) => onChange({ term: "custom", until: e.target.value })}
              aria-label="Last day of the accreditation"
              className="w-full rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-[15px] outline-none focus:border-[var(--accent)] sm:ml-auto sm:w-auto"
            />
          )}
        </label>
      ))}
    </fieldset>
  )
}
