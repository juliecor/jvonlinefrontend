import { apiFile } from "@/lib/api"
import { currentRealtyUser } from "@/lib/realty-auth"

/** /<realty>/dashboard/offers/<id>/reservation-proof — the buyer's proof of payment, for the realty's own people only. */
export async function GET(_: Request, { params }: { params: Promise<{ realty: string; id: string }> }) {
  const { realty, id } = await params
  const session = await currentRealtyUser()
  if (!session || session.user.realty.slug !== realty || !/^\d+$/.test(id)) return new Response("Not found", { status: 404 })
  const res = await apiFile(`/realty/offers/${id}/reservation/proof`, session.token)
  if (!res.ok || !res.body) return new Response(res.status === 404 ? "Not found" : "Could not open the file", { status: res.status === 404 ? 404 : 502 })
  const headers = new Headers({
    "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
    "Content-Security-Policy": "sandbox",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  })
  const disposition = res.headers.get("content-disposition")
  if (disposition) headers.set("Content-Disposition", disposition)
  return new Response(res.body, { headers })
}
