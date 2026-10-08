import type { PublicUnitType, PublicUpdate } from "@/lib/public-projects-types"

export type Milestone = { label: string; percent: number; days: number | null; months?: number | null }

export type Unit = {
  id: number
  name: string
  unit_type: string | null
  category: string
  floor: string | null
  area_sqm: string | null
  price: string | null
  status: "available" | "reserved" | "sold"
  floor_plan_url: string | null
  notes: string | null
  buyer_notes: string | null
  /** Who a reserved or sold unit went to (the buyer only for realty admins). */
  status_detail?: UnitStatusDetail | null
  /** The house model's picture, else the project's photo (added by the project page API). */
  photo?: string | null
}

export type UnitStatusDetail = { offer_id: number | null; offer_code: string | null; buyer: string | null; agent: string | null; by: string | null; at: string | null }

export type PaymentPlan = { id: number; name: string; milestones: Milestone[] }

export type Project = {
  id: number
  name: string
  location: string | null
  lat: number | null
  lng: number | null
  description: string | null
  cover_url: string | null
  fee_notes: string | null
  completion_date: string | null
  status: "active" | "archived"
  is_public?: boolean
  slug?: string | null
  region?: string | null
  stage?: string | null
  units_count?: number
  /** Available units with a price: what New offer can sell. */
  ready_units_count?: number
  payment_plans_count?: number
  offers_count?: number
}

/** Where a project is, as buyers see it (Laravel's Project::STAGES). */
export const STAGES: readonly string[] = ["Pre-selling", "Ongoing", "Ready for occupancy", "Completed", "Sold out"]

/** The Projects page filters, kept in the address (?stage=Ongoing&region=Cebu). */
export type Filters = { q: string; status: string; stage: string; region: string; ready: string }
export const NO_FILTERS: Filters = { q: "", status: "", stage: "", region: "", ready: "" }

export type ProjectDetail = Project & {
  units: Unit[]
  payment_plans: PaymentPlan[]
  slug: string | null
  region: string | null
  stage: string | null
  is_public: boolean
  official_url: string | null
  amenities: string[] | null
  hero_urls: string[]
  site_plan_urls: string[]
  unit_types: PublicUnitType[]
  updates: PublicUpdate[]
}
