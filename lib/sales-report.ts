/** A sales report for a period, as Laravel sends it (App\Support\Reports\SalesReport). */

export type ReportPeriod = { from: string; to: string; label: string; dates: string; days: number; compared_with: string }

export type ReportTotals = {
  offers_sent: number
  opened: number
  answers: number
  interested: number
  questions: number
  not_interested: number
  reserved: number
  sold: number
  value: number
  reservations_confirmed: number
  fees_confirmed: number
}

export type ReportProject = { name: string; location: string | null; offers: number; interested: number; reserved: number; sold: number; value: number; available_now: number }
export type ReportAgent = { name: string; photo: string | null; offers: number; interested: number; deals: number; value: number }
export type ReportDeal = { date: string; status: "reserved" | "sold"; unit: string; project: string | null; buyer: string | null; agent: string | null; price: number }
export type ReportOffer = { date: string; code: string; buyer: string; unit: string | null; project: string | null; agent: string | null; price: number; opened: number; answer: string | null; status: string }

export type SalesReport = {
  realty: { name: string; slug: string; logo_url: string | null; accent_color: string | null }
  period: ReportPeriod
  prepared: { by: string; at: string; scope: string }
  totals: ReportTotals
  previous: ReportTotals
  highlights: string[]
  projects: ReportProject[]
  agents: ReportAgent[]
  deals: ReportDeal[]
  offers: ReportOffer[]
  inventory: { available: number; reserved: number; sold: number }
}

/** The page with the full report, to read or save as a PDF. */
export const reportHref = (slug: string, p: { from: string; to: string }) => `/${slug}/report?from=${p.from}&to=${p.to}`
