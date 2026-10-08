"use server"

import { ApiError, api, errorMessage } from "@/lib/api"

/** `fieldErrors` is keyed like Laravel's: a field's name, or `documents.<kind>` for an attached file. */
export type AccreditationState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> }

/** The realty's accreditation form and its documents → Laravel, in one multipart request. */
export async function submitAccreditation(token: string, formData: FormData): Promise<AccreditationState> {
  // A file input that was left alone still sends an empty File.
  for (const [key, value] of Array.from(formData.entries())) {
    if (value instanceof File && value.size === 0) formData.delete(key)
  }

  try {
    await api(`/accreditation/${encodeURIComponent(token)}`, { method: "POST", body: formData })
    return { ok: true }
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) {
      return {
        error: "Some answers need another look. They are marked below.",
        fieldErrors: Object.fromEntries(Object.entries(e.errors).map(([field, messages]) => [field, messages[0]])),
      }
    }
    return { error: errorMessage(e) }
  }
}
