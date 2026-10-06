import Link from "next/link"
import { ExternalLink, Eye } from "lucide-react"
import { api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"
import { php, shortDate } from "@/lib/format"

export const metadata = { title: "Offers" }

type Offer = {
  id: number; code: string; status: "active" | "void"; buyer_name: string; price: number; views: number; created_at: string
  realty: { id: number; name: string; slug: string } | null; project: string | null; unit: string | null; agent: string | null; url: string
}
type Realty = { id: number; name: string }

/** jvconline.ph/admin/offers — every offer on the platform, filterable by realty. */
export default async function AdminOffersPage({ searchParams }: { searchParams: Promise<{ realty?: string }> }) {
  const { token } = await requireAdmin()
  const { realty } = await searchParams
  const [offers, realties] = await Promise.all([
    api<Offer[]>(`/admin/offers${realty ? `?realty_id=${encodeURIComponent(realty)}` : ""}`, { token }),
    api<Realty[]>("/admin/realties", { token }),
  ])

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Offers</h1>
          <p className="mt-1 text-sm text-slate-500">Sales offers agents have sent to buyers, across all realties.</p>
        </div>
        <form className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500" htmlFor="realty">Realty</label>
          <select id="realty" name="realty" defaultValue={realty ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">All</option>
            {realties.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900">Filter</button>
        </form>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {offers.map((o) => (
            <li key={o.id} className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${o.status === "void" ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{o.buyer_name}</p>
                  <span className="font-mono text-xs text-slate-400">{o.code}</span>
                  {o.status === "void" && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Void</span>}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {o.realty && <Link href={`/admin/realties/${o.realty.id}`} className="font-medium text-slate-700 hover:underline">{o.realty.name}</Link>} · {o.project} · {o.unit} · {php(o.price)}{o.agent && <> · by {o.agent}</>}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">{shortDate(o.created_at)} · <Eye className="h-3 w-3" /> {o.views} view{o.views === 1 ? "" : "s"}</p>
              </div>
              <a href={o.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900">Open <ExternalLink className="h-3.5 w-3.5" /></a>
            </li>
          ))}
          {offers.length === 0 && <li className="px-6 py-10 text-center text-sm text-slate-500">No offers{realty ? " for this realty" : ""} yet.</li>}
        </ul>
      </section>
    </div>
  )
}
