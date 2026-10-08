"use client"

import { useState } from "react"
import type { ChatMessage, ChatSummary, UnitCard } from "./actions"

/** What the assistant is doing while it looks things up, by lookup. */
const STATUS: Record<string, string> = {
  overview: "Checking today's numbers",
  list_projects: "Looking at the projects",
  project_details: "Reading the project",
  search_units: "Searching the units",
  list_offers: "Checking the offers",
  offer_details: "Opening the offer",
  buyer_responses: "Reading buyers' answers",
  list_agents: "Checking the team",
  show_units: "Getting the unit photos",
  compute_payments: "Working out the payments",
  attention_today: "Checking what needs you",
}

/**
 * One conversation with the assistant: the messages, and ask(), which sends a
 * question and follows the answer as it streams in (status, words, unit
 * cards). Used by the AI page and by the Ask panel on every other page.
 */
export function useAssistant({ slug, chatId, initial, onSaved }: { slug: string; chatId: number | null; initial: ChatMessage[]; onSaved?: (chat: ChatSummary, isNew: boolean) => void }) {
  const [chat, setChat] = useState(chatId)
  const [messages, setMessages] = useState(initial)
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  // The answer as it streams in, until it's saved.
  const [streaming, setStreaming] = useState<string | null>(null)
  // Units the answer shows as cards, as soon as the AI picks them.
  const [cards, setCards] = useState<UnitCard[]>([])

  /**
   * Resolves true once the answer is saved; false when it failed (nothing is
   * saved then, so the caller can put the question back in the box).
   * page: the dashboard page it's asked from, so "this project" means something.
   */
  const ask = async (question: string, page?: string): Promise<boolean> => {
    const q = question.trim()
    if (!q || pending) return false
    setError("")
    setPending(true)
    setStatus("Thinking")
    setStreaming(null)
    setCards([])
    setMessages((m) => [...m, { id: -Date.now(), role: "user", content: q, created_at: new Date().toISOString() }])
    const fail = (message: string) => {
      setMessages((m) => m.slice(0, -1))
      setError(message)
      return false
    }

    try {
      const res = await fetch(`/${slug}/dashboard/ai/stream`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, message: q, page: page ?? null }) })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        return fail(data?.message ?? "Something went wrong. Try again.")
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let answer = ""
      // Set by "done" or "error"; the stream ends right after either.
      let result: boolean | null = null
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let cut
        while ((cut = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, cut)
          buffer = buffer.slice(cut + 2)
          const event = chunk.match(/^event: (.+)$/m)?.[1]
          const data = chunk.match(/^data: (.*)$/m)?.[1]
          if (!event || data === undefined) continue
          const payload = JSON.parse(data)
          if (event === "status") setStatus(STATUS[payload.tool] ?? "Looking it up")
          else if (event === "delta") setStreaming((answer += payload.text))
          else if (event === "reset") setStreaming((answer = "") || null)
          else if (event === "cards") {
            setCards(payload.cards)
            setStatus("Writing the answer")
          } else if (event === "error") result = fail(payload.message)
          else if (event === "done") {
            const saved: ChatSummary = payload.chat
            setMessages((m) => [...m, payload.message as ChatMessage])
            if (!chat) setChat(saved.id)
            onSaved?.(saved, !chat)
            result = true
          }
        }
      }
      return result ?? fail("The answer was cut off. Try again.")
    } catch {
      return fail("Couldn't reach the AI. Check your connection and try again.")
    } finally {
      setPending(false)
      setStreaming(null)
      setCards([])
      setStatus("")
    }
  }

  return { chat, messages, pending, status, error, streaming, cards, ask }
}
