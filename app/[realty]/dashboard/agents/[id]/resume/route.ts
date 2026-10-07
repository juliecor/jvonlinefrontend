import { apiFile } from "@/lib/api"
import { currentRealtyUser } from "@/lib/realty-auth"

/**
 * /<realty>/dashboard/agents/<id>/resume — an applicant's resume, for the
 * realty's staff only. Laravel checks who may see it; this passes it on.
 */
export async function GET(_: Request, { params }: { params: Promise<{ realty: string; id: string }> }) {
  const { realty, id } = await params
  const session = await currentRealtyUser()
  if (!session || session.user.realty.slug !== realty || session.user.role !== "realty" || !/^\d+$/.test(id)) {
    return new Response("Not found", { status: 404 })
  }
  const res = await apiFile(`/realty/agents/${id}/resume`, session.token)
  if (!res.ok || !res.body) return new Response(res.status === 404 ? "Not found" : "Could not open the file", { status: res.status === 404 ? 404 : 502 })

  const headers = new Headers({
    "Content-Type": "application/pdf",
    // Uploaded files never run as a page, and never sit in a shared cache.
    "Content-Security-Policy": "sandbox",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  })
  const disposition = res.headers.get("content-disposition")
  if (disposition) headers.set("Content-Disposition", disposition)
  return new Response(res.body, { headers })
}
