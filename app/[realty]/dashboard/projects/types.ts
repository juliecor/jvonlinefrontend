export type Milestone = { label: string; percent: number; days: number | null }

export type Unit = {
  id: number
  name: string
  unit_type: string | null
  category: string
  floor: string | null
  area_sqm: string | null
  price: string
  status: "available" | "reserved" | "sold"
  floor_plan_url: string | null
  notes: string | null
}

export type PaymentPlan = { id: number; name: string; milestones: Milestone[] }

export type Project = {
  id: number
  name: string
  location: string | null
  description: string | null
  cover_url: string | null
  fee_notes: string | null
  completion_date: string | null
  status: "active" | "archived"
  units_count?: number
  payment_plans_count?: number
  offers_count?: number
}

export type ProjectDetail = Project & { units: Unit[]; payment_plans: PaymentPlan[] }
