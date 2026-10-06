import Link from "next/link"
import { Eye, ExternalLink, Plus } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { api } from "@/lib/api"
import { php, shortDate } from "@/lib/format"
import { requireRealtyUser } from "@/lib/realty-auth"
import { voidOffer } from "./actions"

export const metadata = { title: "Offers" }

type Offer = {
  id: number
  code: string
  status: "active" | "void"
  buyer_name: string
  buyer_email: string | null
  purchase_date: string
  price: number
  views: number
  created_at: string
  project: string | null
  unit: string | null
  agent: string | null
  url: string
}

/** jvconline.ph/<realty>/dashboard/offers — agents see theirs, staff see the whole realty's. */
export default async function OffersPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const offers = await api<Offer[]>("/realty/offers", { token })
  const staff = user.role === "realty"

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sales offers</h1>
          <p className="mt-1 text-sm text-slate-500">{staff ? "Every offer your agents have sent." : "The offers you've sent to buyers."}</p>
        </div>
        <Link href={`/${slug}/dashboard/offers/new`} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
          <Plus className="h-4 w-4" /> New offer
        </Link>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {offers.map((o) => (
            <li key={o.id} className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${o.status === "void" ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{o.buyer_name}</p>
                  <span className="font-mono text-xs text-slate-400">{o.code}</span>
                  {o.status === "void" && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Void</span>}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {o.project} · {o.unit} · {php(o.price)}
                  {staff && o.agent && <> · by {o.agent}</>}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  {shortDate(o.created_at)} · <Eye className="h-3 w-3" /> {o.views} view{o.views === 1 ? "" : "s"}
                </p>
              </div>
              {o.status === "active" && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <CopyButton text={o.url} />
                  <a href={o.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900">
                    Open <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <form action={voidOffer.bind(null, slug, o.id)}>
                    <button type="submit" className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-700">Void</button>
                  </form>
                </div>
              )}
            </li>
          ))}
          {offers.length === 0 && <li className="px-6 py-10 text-center text-sm text-slate-500">No offers yet.</li>}
        </ul>
      </section>
    </div>
  )
}
