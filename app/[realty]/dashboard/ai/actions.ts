"use server"

import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export type ChatMessage = { id: number; role: "user" | "assistant"; content: string; created_at: string }
export type ChatSummary = { id: number; title: string; updated_at: string }

/** One question to the assistant; Laravel looks things up, asks OpenAI, and saves both sides. */
export async function askAssistant(slug: string, chatId: number | null, message: string): Promise<{ chat?: ChatSummary; message?: ChatMessage; error?: string }> {
  const { token } = await requireRealtyUser(slug)
  try {
    return await api<{ chat: ChatSummary; message: ChatMessage }>("/realty/assistant/messages", { method: "POST", token, body: { chat_id: chatId, message } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export async function deleteChat(slug: string, chatId: number): Promise<{ error?: string }> {
  const { token } = await requireRealtyUser(slug)
  try {
    await api(`/realty/assistant/chats/${chatId}`, { method: "DELETE", token })
    return {}
  } catch (e) {
    return { error: errorMessage(e) }
  }
}
