"use server"

import { redirect } from "next/navigation"
import { api, errorMessage } from "@/lib/api"
import { type AuthUser, adminToken, clearAdminToken, setAdminToken } from "@/lib/admin-auth"

export type LoginState = { error?: string }

export async function signInAdmin(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  if (!email || !password) return { error: "Enter your email and password." }

  let token: string
  try {
    const res = await api<{ token: string; user: AuthUser }>("/auth/login", { method: "POST", body: { email, password, device: "admin-web" } })
    if (res.user.role !== "admin") {
      await api("/auth/logout", { method: "POST", token: res.token }).catch(() => {})
      return { error: "This login isn't an admin account." }
    }
    token = res.token
  } catch (e) {
    return { error: errorMessage(e) }
  }

  await setAdminToken(token)
  redirect("/admin")
}

export async function signOutAdmin(): Promise<void> {
  const token = await adminToken()
  if (token) await api("/auth/logout", { method: "POST", token }).catch(() => {})
  await clearAdminToken()
  redirect("/admin/login")
}
