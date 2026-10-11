import { apiFile } from "@/lib/api"
import { currentRealtyUser } from "@/lib/realty-auth"

/**
 * /<realty>/dashboard/tasks/<id>/files/<file> — a file on a task, for the
 * people who can see the task. Laravel checks who may; this passes it on.
 */
export async function GET(_: Request, { params }: { params: Promise<{ realty: string; id: string; file: string }> }) {
  const { realty, id, file } = await params
  const session = await currentRealtyUser()
  if (!session || session.user.realty.slug !== realty || !/^\d+$/.test(id) || !/^\d+$/.test(file)) {
    return new Response("Not found", { status: 404 })
  }
  const res = await apiFile(`/realty/tasks/${id}/files/${file}`, session.token)
  if (!res.ok || !res.body) return new Response(res.status === 404 ? "Not found" : "Could not open the file", { status: res.status === 404 ? 404 : 502 })

  const headers = new Headers({
    "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
    // Uploaded files never run as a page, and never sit in a shared cache.
    "Content-Security-Policy": "sandbox",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  })
  const disposition = res.headers.get("content-disposition")
  if (disposition) headers.set("Content-Disposition", disposition)
  return new Response(res.body, { headers })
}
