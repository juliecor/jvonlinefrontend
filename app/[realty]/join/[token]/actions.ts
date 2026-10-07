"use server"

import { redirect } from "next/navigation"
import { api, errorMessage } from "@/lib/api"
import type { PublicRealty } from "@/lib/realty-auth"

export type JoinState = { error?: string; name?: string; email?: string; phone?: string }

/**
 * The agent's application: name, login email, contact number, resume and password. Laravel
 * creates the account as pending; the realty's staff approve it before they can sign in.
 * Multipart because of the resume.
 */
export async function joinRealty(token: string, _: JoinState, formData: FormData): Promise<JoinState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const keep = { name, email, phone }
  const resume = formData.get("resume")
  if (!name || !email || !phone) return { error: "Enter your name, email and contact number.", ...keep }
  // An empty file input still sends a File; the picked file is cleared after any error, so say so.
  if (!(resume instanceof File) || resume.size === 0) return { error: "Attach your resume (PDF).", ...keep }
  if (String(formData.get("password") ?? "") !== String(formData.get("password_confirmation") ?? "")) {
    return { error: "The two passwords don't match. Choose your resume again too.", ...keep }
  }

  let slug: string
  try {
    const res = await api<{ realty: PublicRealty }>(`/join/${encodeURIComponent(token)}`, { method: "POST", body: formData })
    slug = res.realty.slug
  } catch (e) {
    return { error: `${errorMessage(e)} Choose your resume again before sending.`, ...keep }
  }
  redirect(`/${slug}/login?applied=1`)
}
