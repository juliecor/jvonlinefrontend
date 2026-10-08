import "server-only"
import { headers } from "next/headers"

/**
 * Calls to the Laravel backend (API_URL). Only the Next.js server talks to
 * Laravel; the browser talks to Next. Tokens come from the httpOnly cookies
 * in lib/admin-auth.ts and lib/realty-auth.ts.
 */

const base = () => {
  const url = process.env.API_URL
  if (!url) throw new Error("API_URL is not set")
  return url.replace(/\/$/, "")
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Laravel's validation errors, field → messages. */
    public errors: Record<string, string[]> = {},
  ) {
    super(message)
  }
}

type Options = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; token?: string | null; headers?: Record<string, string> }

/**
 * The visitor's IP, passed to Laravel with the shared key so its rate limits
 * and records see the real visitor instead of this server. Outside a request
 * (nothing to forward) it's simply left out.
 */
async function visitorHeaders(): Promise<Record<string, string>> {
  const key = process.env.API_INTERNAL_KEY
  if (!key) return {}
  try {
    const h = await headers()
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || ""
    return ip ? { "X-Client-IP": ip, "X-Internal-Key": key } : {}
  } catch {
    return {}
  }
}

/** `body` may be a FormData (sent as multipart, for uploads) or anything JSON-serialisable. */
export async function api<T>(path: string, { method = "GET", body, token, headers: extra }: Options = {}): Promise<T> {
  const multipart = body instanceof FormData
  const res = await fetch(`${base()}/api${path}`, {
    method,
    headers: {
      ...(await visitorHeaders()),
      Accept: "application/json",
      ...(body !== undefined && !multipart ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    },
    body: multipart ? body : body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  // Laravel answers JSON, but a web server or PHP limit in front of it can answer with a plain page.
  let data: { message?: string; errors?: Record<string, string[]> } | null = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    if (res.ok) throw new ApiError(res.status, "The server sent back something unexpected. Please try again.")
  }
  if (!res.ok) {
    // 413 comes from Nginx or Laravel when the files are bigger than the server accepts.
    throw new ApiError(res.status, data?.message || (res.status === 413 ? "That upload is too big for the server. Try smaller files." : `Request failed (${res.status})`), data?.errors ?? {})
  }
  return data as T
}

/** A raw GET (a file, not JSON) — the caller streams the body on. */
/** A POST whose answer streams back (the AI assistant); the caller reads or passes on the body. */
export async function apiStream(path: string, token: string, body: unknown): Promise<Response> {
  return fetch(`${base()}/api${path}`, {
    method: "POST",
    headers: { ...(await visitorHeaders()), Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    cache: "no-store",
  })
}

export async function apiFile(path: string, token: string): Promise<Response> {
  return fetch(`${base()}/api${path}`, { headers: { ...(await visitorHeaders()), Authorization: `Bearer ${token}` }, cache: "no-store" })
}

/** The first validation message, or the general one — for a form's error line. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const first = Object.values(e.errors)[0]?.[0]
    return first ?? e.message
  }
  if (e instanceof Error && e.message.includes("fetch failed")) return "Can't reach the server. Is the backend running?"
  return "Something went wrong. Please try again."
}
