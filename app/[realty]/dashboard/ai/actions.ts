"use server"

import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import type { LeadKind } from "@/components/leads"
import type { RequirementSummary } from "@/lib/requirements-types"
import type { MilestoneInput } from "@/lib/schedule"

/** A unit the AI showed under its answer, from the live units (so its price and status are current). */
export type UnitCard = {
  type: "unit"
  id: number
  name: string
  project: { id: number; name: string | null; location: string | null }
  unit_type: string | null
  floor: string | null
  area_sqm: number | null
  price: number | null
  status: "available" | "reserved" | "sold"
  photo: string | null
  /** Available, priced and in a project open for offers: the card offers "Make offer". */
  can_offer: boolean
}
/** A buyer's offer, as the offers list shows it. */
export type OfferCard = {
  type: "offer"
  id: number
  code: string
  buyer: string
  status: "active" | "void"
  project: string | null
  unit: string | null
  price: number
  /** Who sent it (admins see it; agents only ever see their own). */
  agent: string | null
  photo: string | null
  sent: string
  views: number
  last_viewed_at: string | null
  answer: { kind: LeadKind; label: string; at: string } | null
  new_answers: number
  requirements: RequirementSummary
  approval_status: "pending" | "approved" | "rejected" | null
  unit_status: "reserved" | "sold" | null
  /** The buyer's link, once they can open it. */
  url: string | null
}

export type ProjectCard = {
  type: "project"
  id: number
  name: string
  location: string | null
  stage: string | null
  open: boolean
  photo: string | null
  units: { total: number; available: number; reserved: number; sold: number }
  price: { min: number; max: number } | null
  plans: number
  can_offer: boolean
}

/** A payment schedule the AI worked out (the same math as offers), and what "Make offer with these terms" needs. */
export type PaymentCard = {
  type: "payment"
  unit: { id: number; name: string } | null
  project: { id: number; name: string } | null
  price: number
  /** The unit's price now, when it changed since the AI worked this out. */
  price_now: number | null
  terms: string
  plan_id: number | null
  purchase_date: string
  payments: { label: string; percent: number; amount: number; date: string | null; months: number | null; monthly: number | null; end_date: string | null; last_month: number | null }[]
  milestones: MilestoneInput[]
  can_offer: boolean
}

export type Card = UnitCard | OfferCard | ProjectCard | PaymentCard

export type ChatMessage = { id: number; role: "user" | "assistant"; content: string; created_at: string; cards?: Card[] }
export type ChatSummary = { id: number; title: string; updated_at: string }

export async function deleteChat(slug: string, chatId: number): Promise<{ error?: string }> {
  const { token } = await requireRealtyUser(slug)
  try {
    await api(`/realty/assistant/chats/${chatId}`, { method: "DELETE", token })
    return {}
  } catch (e) {
    return { error: errorMessage(e) }
  }
}
