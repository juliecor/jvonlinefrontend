"use server"

import { redirect } from "next/navigation"
import { api, errorMessage } from "@/lib/api"
import type { PublicRealty } from "@/lib/realty-auth"

export type JoinState = { error?: string; name?: string; email?: string }

/** The agent sets their name, email and password; Laravel creates the account under the realty. */
export async function joinRealty(token: string, _: JoinState, formData: FormData): Promise<JoinState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("password_confirmation") ?? "")
  if (!name || !email) return { error: "Enter your name and email.", name, email }
  if (password !== confirm) return { error: "The two passwords don't match.", name, email }

  let slug: string
  try {
    const res = await api<{ realty: PublicRealty }>(`/join/${encodeURIComponent(token)}`, { method: "POST", body: { name, email, password, password_confirmation: confirm } })
    slug = res.realty.slug
  } catch (e) {
    return { error: errorMessage(e), name, email }
  }
  redirect(`/${slug}/login?joined=1`)
}
