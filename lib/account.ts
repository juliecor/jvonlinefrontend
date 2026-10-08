import "server-only"
import { ApiError, api, errorMessage } from "./api"
import type { AccountState } from "@/components/account-settings"

/**
 * The account page's two saves (details, password), for whichever session
 * the caller already checked: the realty dashboard's or the platform's.
 */
export async function saveAccount(token: string, kind: "details" | "password", form: FormData): Promise<AccountState> {
  const text = (k: string) => String(form.get(k) ?? "")
  try {
    if (kind === "details") {
      await api("/account", { method: "PATCH", token, body: { name: text("name"), email: text("email"), phone: text("phone") || null, current_password: text("current_password") || null } })
    } else {
      await api("/account/password", { method: "POST", token, body: { current_password: text("current_password"), password: text("password"), password_confirmation: text("password_confirmation") } })
    }
    return { ok: Date.now() }
  } catch (e) {
    if (e instanceof ApiError && Object.keys(e.errors).length) return { errors: Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])) }
    if (e instanceof ApiError && e.status === 429) return { error: "Too many tries. Wait a minute and try again." }
    return { error: errorMessage(e) }
  }
}
