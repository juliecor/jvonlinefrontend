"use server"

import { revalidatePath } from "next/cache"
import type { AccountState } from "@/components/account-settings"
import { saveAccount } from "@/lib/account"
import { requireRealtyUser } from "@/lib/realty-auth"

export async function saveDetails(slug: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const { token } = await requireRealtyUser(slug)
  const result = await saveAccount(token, "details", form)
  // The sidebar shows the name and email.
  if (result.ok) revalidatePath(`/${slug}/dashboard`, "layout")
  return result
}

export async function changePassword(slug: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const { token } = await requireRealtyUser(slug)
  return saveAccount(token, "password", form)
}
