"use server"

import { revalidatePath } from "next/cache"
import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export type AgentInviteState = { error?: string; url?: string; name?: string }

/** Realty staff makes an invite link for an agent and sends it on themselves. */
export async function inviteAgent(slug: string, _: AgentInviteState, formData: FormData): Promise<AgentInviteState> {
  const { token, user } = await requireRealtyUser(slug)
  if (user.role !== "realty") return { error: "Only realty staff can invite agents." }
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  if (!name) return { error: "Enter the agent's name." }
  if (phone && !/^09\d{9}$/.test(phone)) return { error: "Enter an 11-digit mobile number starting with 09, numbers only, like 09171234567." }

  try {
    const inv = await api<{ join_url: string }>("/realty/agents", { method: "POST", token, body: { name, email: email || null, phone: phone || null } })
    revalidatePath(`/${slug}/dashboard`, "layout")
    return { url: inv.join_url, name }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export type NewLinkState = { error?: string; url?: string }

/** A fresh link for an open invitation; the old one stops working. */
export async function newAgentLink(slug: string, _: NewLinkState, formData: FormData): Promise<NewLinkState> {
  const { token } = await requireRealtyUser(slug)
  const id = Number(formData.get("id"))
  if (!id) return { error: "Unknown invitation." }
  try {
    const inv = await api<{ join_url: string }>(`/realty/agents/invitations/${id}/resend`, { method: "POST", token })
    revalidatePath(`/${slug}/dashboard/agents`)
    return { url: inv.join_url }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}

export type ReviewState = { error?: string }

/** Approve, reject or delete an agent's application. Staff only; the sidebar counts update with it. */
export async function reviewApplication(slug: string, id: number, decision: "approve" | "reject" | "delete"): Promise<ReviewState> {
  const { token, user } = await requireRealtyUser(slug)
  if (user.role !== "realty") return { error: "Only realty staff can review applications." }
  try {
    if (decision === "delete") await api(`/realty/agents/${id}`, { method: "DELETE", token })
    else await api(`/realty/agents/${id}/${decision}`, { method: "POST", token })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard`, "layout")
  return {}
}
