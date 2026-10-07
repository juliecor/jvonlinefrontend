import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { api } from "./api"

/**
 * The admin's session: Laravel's Sanctum token in an httpOnly cookie that only
 * the Next.js server reads. Laravel expires the token after 12 hours too.
 */

export const ADMIN_COOKIE = "jv_admin"
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60

export type AuthUser = { id: number; name: string; email: string; role: "admin" | "realty" | "agent"; status?: "pending" | "active" | "rejected"; realty_id: number | null }

export async function adminToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_COOKIE)?.value ?? null
}

export async function setAdminToken(token: string): Promise<void> {
  ;(await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: ADMIN_SESSION_SECONDS,
  })
}

export async function clearAdminToken(): Promise<void> {
  ;(await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" })
}

/** The signed-in admin, or null when the cookie is missing, expired or not an admin's. */
export async function currentAdmin(): Promise<{ user: AuthUser; token: string } | null> {
  const token = await adminToken()
  if (!token) return null
  try {
    const user = await api<AuthUser>("/auth/me", { token })
    return user.role === "admin" ? { user, token } : null
  } catch {
    return null
  }
}

/** For pages under /admin: hands back the admin or sends the visitor to the login. */
export async function requireAdmin(): Promise<{ user: AuthUser; token: string }> {
  const session = await currentAdmin()
  if (!session) redirect("/admin/login")
  return session
}
