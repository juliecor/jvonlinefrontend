"use server"

import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export type ChatMessage = { id: number; role: "user" | "assistant"; content: string; created_at: string }
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
