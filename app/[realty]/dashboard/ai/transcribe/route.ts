import { ApiError, api, errorMessage } from "@/lib/api"
import { currentRealtyUser } from "@/lib/realty-auth"

/**
 * POST /<realty>/dashboard/ai/transcribe — a spoken question (the mic button)
 * goes to Laravel with the person's session and comes back as text.
 */
export async function POST(request: Request, { params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const session = await currentRealtyUser()
  if (!session || session.user.realty.slug !== slug) return Response.json({ message: "Your session ended. Sign in again." }, { status: 401 })

  const audio = (await request.formData().catch(() => null))?.get("audio")
  if (!(audio instanceof File) || audio.size === 0) return Response.json({ message: "No recording came through. Try again." }, { status: 422 })

  const body = new FormData()
  body.append("audio", audio, audio.name || "question.webm")
  try {
    return Response.json(await api<{ text: string }>("/realty/assistant/transcribe", { method: "POST", token: session.token, body }))
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 502
    return Response.json({ message: status === 429 ? "That's a lot at once. Wait a minute and try again." : errorMessage(e) }, { status })
  }
}
