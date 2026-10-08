"use server"

import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

/** A unit the AI showed under its answer, from the live units (so its price and status are current). */
export type UnitCard = {
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
export type ChatMessage = { id: number; role: "user" | "assistant"; content: string; created_at: string; cards?: UnitCard[] }
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
