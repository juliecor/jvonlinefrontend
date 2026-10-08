"use server"

import { revalidatePath } from "next/cache"
import type { AccountState } from "@/components/account-settings"
import { saveAccount } from "@/lib/account"
import { requireAdmin } from "@/lib/admin-auth"

export async function saveDetails(_prev: AccountState, form: FormData): Promise<AccountState> {
  const { token } = await requireAdmin()
  const result = await saveAccount(token, "details", form)
  // The sidebar shows the name and email.
  if (result.ok) revalidatePath("/admin", "layout")
  return result
}

export async function changePassword(_prev: AccountState, form: FormData): Promise<AccountState> {
  const { token } = await requireAdmin()
  return saveAccount(token, "password", form)
}
