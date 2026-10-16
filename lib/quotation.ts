import type { MilestoneInput } from "@/lib/schedule"

/** A quotation (sample computation) for a buyer, as Laravel sends it (Realty\QuotationController). */
export type Quotation = {
  realty: { name: string; slug: string; logo_url: string | null; accent_color: string | null; email: string | null; phone: string | null; address: string | null }
  prepared: { by: string; email: string; phone: string | null; at: string; reference: string }
  buyer: string | null
  unit: { id: number; name: string; model: string | null; category: string | null; floor: string | null; lot_area_sqm: number | null; floor_area_sqm: number | null; features: string[]; status: string; photo: string | null } | null
  project: { id: number; name: string; location: string | null; stage: string | null; completion_date: string | null; fee_notes: string | null; photo: string | null } | null
  price: number
  price_from_model: boolean
  terms: string
  plan_id: number | null
  milestones: MilestoneInput[]
  purchase_date: string
  schedule: { label: string; percent: number; amount: number; date: string | null; months: number | null; monthly: number | null; end_date: string | null; last_month: number | null }[]
  total: number
  can_offer: boolean
}

/** What a quotation is worked out from: the AI's payment card carries all of it. */
export type QuotationInput = { unit_id?: number; project_id?: number; price?: number; plan_id?: number; milestones?: MilestoneInput[]; purchase_date?: string; buyer?: string }

/** The quotation page for these terms; everything rides in the address (nothing is saved). */
export function quotationHref(slug: string, input: QuotationInput): string {
  const bytes = new TextEncoder().encode(JSON.stringify(input))
  const q = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `/${slug}/quotation?q=${q}`
}
