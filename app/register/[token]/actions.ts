"use server"

import { redirect } from "next/navigation"
import { api, errorMessage } from "@/lib/api"
import type { PublicRealty } from "@/lib/realty-auth"

export type RegisterValues = { name: string; address: string; about: string; contact_name: string; email: string; phone: string }
export type RegisterState = { error?: string; values?: RegisterValues }

/** The realty's registration form → Laravel. Multipart because of the logo. */
export async function registerRealty(token: string, _: RegisterState, formData: FormData): Promise<RegisterState> {
  const str = (k: string) => String(formData.get(k) ?? "")
  const values: RegisterValues = { name: str("name"), address: str("address"), about: str("about"), contact_name: str("contact_name"), email: str("email"), phone: str("phone") }
  if (str("password") !== str("password_confirmation")) {
    return { error: "The two passwords don't match.", values }
  }
  const logo = formData.get("logo")
  if (logo instanceof File && logo.size === 0) formData.delete("logo") // an empty file input still sends a File

  let slug: string
  try {
    const res = await api<{ realty: PublicRealty }>(`/register/${encodeURIComponent(token)}`, { method: "POST", body: formData })
    slug = res.realty.slug
  } catch (e) {
    return { error: errorMessage(e), values }
  }
  redirect(`/${slug}/login?registered=1`)
}
