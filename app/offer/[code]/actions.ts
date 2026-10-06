"use server"

import { api, errorMessage } from "@/lib/api"

export type RespondState = { error?: string; done?: "interested" | "question" | "not_interested"; name?: string }

/** The buyer's answer to the offer → Laravel, which saves the lead and emails the agent. */
export async function respondToOffer(code: string, _: RespondState, fd: FormData): Promise<RespondState> {
  const str = (k: string) => String(fd.get(k) ?? "").trim()
  const kind = str("kind") as NonNullable<RespondState["done"]>
  const name = str("name")
  if (!name) return { error: "Please enter your name." }
  if (kind !== "not_interested" && !str("phone")) return { error: "Please enter your mobile number so we can reach you." }
  try {
    await api(`/offers/${encodeURIComponent(code)}/respond`, {
      method: "POST",
      body: {
        kind,
        name,
        phone: str("phone") || null,
        email: str("email") || null,
        contact_via: str("contact_via") || null,
        message: str("message") || null,
        website: str("website"),
      },
    })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  return { done: kind, name }
}
