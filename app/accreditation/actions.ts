"use server"

import { ApiError, api, errorMessage } from "@/lib/api"
import { SITE_REALTY } from "@/lib/public-projects-types"

/** `fieldErrors` is keyed like Laravel's: a field's name, or `documents.<kind>` for an attached file. */
export type AccreditationState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> }

/** The realty's accreditation form from its invite link → Laravel, in one multipart request. */
export async function submitAccreditation(token: string, formData: FormData): Promise<AccreditationState> {
  return send(`/accreditation/${encodeURIComponent(token)}`, formData)
}

/** The same form, sent from the website without an invite (jvconline.ph/accreditation). */
export async function submitOpenAccreditation(formData: FormData): Promise<AccreditationState> {
  return send(`/realties/${SITE_REALTY}/accreditation`, formData)
}

async function send(path: string, formData: FormData): Promise<AccreditationState> {
  // A file input that was left alone still sends an empty File.
  for (const [key, value] of Array.from(formData.entries())) {
    if (value instanceof File && value.size === 0) formData.delete(key)
  }

  try {
    await api(path, { method: "POST", body: formData })
    return { ok: true }
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) {
      return {
        error: "Some answers need another look. They are marked below.",
        fieldErrors: Object.fromEntries(Object.entries(e.errors).map(([field, messages]) => [field, messages[0]])),
      }
    }
    if (e instanceof ApiError && e.status === 429) return { error: "Too many tries. Wait a minute and try again." }
    return { error: errorMessage(e) }
  }
}
