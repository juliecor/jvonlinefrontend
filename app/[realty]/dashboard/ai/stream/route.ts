import { apiStream } from "@/lib/api"
import { currentRealtyUser } from "@/lib/realty-auth"

/**
 * POST /<realty>/dashboard/ai/stream — the browser's question goes to Laravel
 * with the person's session (which the browser never sees), and the answer
 * streams straight back, word by word, as server-sent events.
 */
export async function POST(request: Request, { params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const session = await currentRealtyUser()
  if (!session || session.user.realty.slug !== slug) return Response.json({ message: "Your session ended. Sign in again." }, { status: 401 })

  const { chat_id, message, page } = (await request.json().catch(() => ({}))) as { chat_id?: number | null; message?: string; page?: string | null }
  // page: the dashboard page it's asked from (the Ask panel), so "this project" means something.
  const upstream = await apiStream("/realty/assistant/stream", session.token, { chat_id: chat_id ?? null, message: message ?? "", page: page ?? null })

  // Problems before the answer starts (too many questions, a bad chat) come back as JSON.
  if (!upstream.ok || !upstream.body || !upstream.headers.get("content-type")?.includes("text/event-stream")) {
    const data = await upstream.json().catch(() => null)
    const text = upstream.status === 429 ? "That's a lot of questions at once. Wait a minute and try again." : (data?.message ?? "The AI couldn't answer right now. Try again in a moment.")
    return Response.json({ message: text }, { status: upstream.ok ? 502 : upstream.status })
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      // Nginx in front of the site would otherwise hold the words back.
      "X-Accel-Buffering": "no",
    },
  })
}
