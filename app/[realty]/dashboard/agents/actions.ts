"use server"

import { revalidatePath } from "next/cache"
import { api, errorMessage } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"

export type AgentInviteState = { error?: string; sent?: string }

/** Realty staff invites an agent by email. */
export async function inviteAgent(slug: string, _: AgentInviteState, formData: FormData): Promise<AgentInviteState> {
  const { token, user } = await requireRealtyUser(slug)
  if (user.role !== "realty") return { error: "Only realty staff can invite agents." }
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  if (!name || !email) return { error: "Name and email are needed." }

  try {
    await api("/realty/agents", { method: "POST", token, body: { name, email } })
  } catch (e) {
    return { error: errorMessage(e) }
  }
  revalidatePath(`/${slug}/dashboard/agents`)
  revalidatePath(`/${slug}/dashboard`)
  return { sent: `Invite sent to ${email}.` }
}

export type ResendAgentState = { error?: string; sent?: string }

export async function resendAgentInvite(slug: string, _: ResendAgentState, formData: FormData): Promise<ResendAgentState> {
  const { token } = await requireRealtyUser(slug)
  const id = Number(formData.get("id"))
  if (!id) return { error: "Unknown invitation." }
  try {
    const inv = await api<{ email: string }>(`/realty/agents/invitations/${id}/resend`, { method: "POST", token })
    revalidatePath(`/${slug}/dashboard/agents`)
    return { sent: `Sent again to ${inv.email}.` }
  } catch (e) {
    return { error: errorMessage(e) }
  }
}
