/**
 * Payment schedules, client-safe — the same arithmetic as Laravel's
 * Offer::buildSchedule, so a preview matches the offer to the centavo.
 */

export type MilestoneInput = { label: string; percent: number; days: number | null; months?: number | null }

export type Installment = { n: number; date: string; amount: number }

export type ScheduleRow = {
  label: string
  percent: number
  date: string | null
  amount: number
  months?: number
  monthly?: number
  end_date?: string
  installments?: Installment[]
}

const pad = (n: number) => String(n).padStart(2, "0")

// Plain calendar arithmetic on YYYY-MM-DD, no time zone involved.
export const addDays = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** Carbon's addMonthsNoOverflow: Jan 31 + 1 month = Feb 28/29, not Mar 3. */
export const addMonths = (ymd: string, months: number) => {
  const [y, m, d] = ymd.split("-").map(Number)
  const total = m - 1 + months
  const year = y + Math.floor(total / 12)
  const month = ((total % 12) + 12) % 12
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return `${year}-${pad(month + 1)}-${pad(Math.min(d, last))}`
}

const cents = (n: number) => Math.round(n * 100) / 100

export function buildSchedule(price: number, milestones: MilestoneInput[], purchaseDate: string, completionDate: string | null): ScheduleRow[] {
  let running = 0
  return milestones.map((m, i) => {
    const amount = i === milestones.length - 1 ? cents(price - running) : cents((price * m.percent) / 100)
    running += amount
    const date = m.days === null ? completionDate : purchaseDate ? addDays(purchaseDate, m.days) : null
    const row: ScheduleRow = { label: m.label, percent: m.percent, date, amount }
    const months = m.months ?? 0
    if (months >= 2 && date) {
      const each = Math.floor((amount / months) * 100) / 100
      const installments = Array.from({ length: months }, (_, n) => ({ n: n + 1, date: addMonths(date, n), amount: n === months - 1 ? cents(amount - each * (months - 1)) : each }))
      Object.assign(row, { months, monthly: each, end_date: installments[months - 1].date, installments })
    }
    return row
  })
}

/** "0.54%" — a percentage the way people read it, however many decimals it's stored with. */
export const pct = (n: number) => `${Number(n.toFixed(2)).toLocaleString("en-PH", { maximumFractionDigits: 2 })}%`
