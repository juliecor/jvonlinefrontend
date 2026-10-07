/** Buyer requirements as the API sends them — shared by the offer page and the dashboard (client-safe). */

export type ReqFile = {
  id: number
  name: string
  size: number
  status: "pending" | "approved" | "rejected"
  note: string | null
  uploaded_at: string
  // Dashboard only
  mime?: string
  reviewed_at?: string | null
  reviewed_by?: string | null
}

export type Requirement = {
  id: number
  name: string
  help: string | null
  applies: string
  /** What it means for this buyer: must send, send if it applies to them, or not for them (per their details). */
  needed: "required" | "optional" | "not_needed"
  state: "missing" | "review" | "approved" | "rejected"
  note: string | null
  files: ReqFile[]
}

export type RequirementSummary = { required: number; submitted: number; approved: number; missing: number; to_review: number; details: boolean }

export const INCOME_SOURCES = [
  { v: "employed", l: "Employed (local)" },
  { v: "self_employed", l: "Self-employed / business" },
  { v: "ofw", l: "OFW" },
  { v: "online", l: "Online job" },
  { v: "commission", l: "Commission-based" },
  { v: "rental", l: "Rental income" },
  { v: "transport", l: "Transport franchise" },
  { v: "other", l: "Other" },
] as const

export const STATE_LABEL = { missing: "Missing", review: "Under review", approved: "Approved", rejected: "Please upload again" } as const

export const fileSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
