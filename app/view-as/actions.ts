"use server"

import { redirect } from "next/navigation"
import { adminToken, setAdminToken } from "@/lib/admin-auth"
import { api, errorMessage } from "@/lib/api"
import { clearRealtyToken, realtyToken, setRealtyToken } from "@/lib/realty-auth"

export type ViewTarget = { role: "admin" } | { role: "realty" | "agent"; realty: string }

/**
 * A super admin's "Switch role". On /admin pages the admin cookie signs the
 * request; inside a realty preview, the preview token does. Laravel ends the
 * previous preview either way, so there's only ever one.
 */
export async function switchView(from: "admin" | "realty", target: ViewTarget): Promise<{ error?: string }> {
  const token = from === "admin" ? await adminToken() : await realtyToken()
  if (!token) redirect("/admin/login")

  let next: string
  try {
    next = (await api<{ token: string }>("/auth/view-as", { method: "POST", token, body: target })).token
  } catch (e) {
    return { error: errorMessage(e) }
  }

  if (target.role === "admin") {
    await setAdminToken(next)
    await clearRealtyToken()
    redirect("/admin")
  }
  await setRealtyToken(next)
  redirect(`/${target.realty}/dashboard`)
}
