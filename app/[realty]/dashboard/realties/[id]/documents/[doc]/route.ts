import { apiFile } from "@/lib/api"
import { currentRealtyUser } from "@/lib/realty-auth"
import { isDeveloperStaff } from "@/lib/realty-roles"

/**
 * /<realty>/dashboard/realties/<id>/documents/<doc> — a file attached to an accreditation form, for the
 * developer's admins only. Laravel checks who may see it; this passes it on.
 */
export async function GET(_: Request, { params }: { params: Promise<{ realty: string; id: string; doc: string }> }) {
  const { realty, id, doc } = await params
  const session = await currentRealtyUser()
  if (!session || session.user.realty.slug !== realty || !isDeveloperStaff(session.user) || session.user.must_change_password || !/^\d+$/.test(id) || !/^\d+$/.test(doc)) {
    return new Response("Not found", { status: 404 })
  }
  const res = await apiFile(`/realty/realties/accreditations/${id}/documents/${doc}`, session.token)
  if (!res.ok || !res.body) return new Response(res.status === 404 ? "Not found" : "Could not open the file", { status: res.status === 404 ? 404 : 502 })

  const type = res.headers.get("content-type") ?? "application/octet-stream"
  const headers = new Headers({
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  })
  // Uploaded files never run as a page. A PDF is the one thing shown in a frame on the review page, and a
  // sandboxed response would stop the browser's PDF viewer; its type is checked on upload and nosniff keeps it a PDF.
  if (!type.toLowerCase().startsWith("application/pdf")) headers.set("Content-Security-Policy", "sandbox")
  const disposition = res.headers.get("content-disposition")
  if (disposition) headers.set("Content-Disposition", disposition)
  return new Response(res.body, { headers })
}
