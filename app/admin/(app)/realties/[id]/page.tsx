import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Eye } from "lucide-react"
import { ApiError, api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"
import { php, shortDate } from "@/lib/format"
import { ResendButton } from "../resend-button"

type Detail = {
  realty: {
    id: number; name: string; slug: string; email: string | null; contact_name: string | null; phone: string | null; address: string | null; about: string | null
    status: "invited" | "active"; logo_url: string | null; invited_at: string | null; registered_at: string | null
    users_count: number; agents_count: number; projects_count: number; offers_count: number
  }
  people: { id: number; name: string; email: string; role: "realty" | "agent"; joined_at: string }[]
  projects: { id: number; name: string; location: string | null; status: string; units_count: number; payment_plans_count: number; offers_count: number }[]
  offers: { id: number; code: string; status: string; buyer_name: string; price: number; views: number; created_at: string; project: string | null; unit: string | null; agent: string | null; url: string }[]
  offer_views: number
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  return { title: `Realty ${(await params).id}` }
}

/** jvconline.ph/admin/realties/<id> — everything about one realty, read-only. */
export default async function AdminRealtyPage({ params }: Props) {
  const { id } = await params
  const { token } = await requireAdmin()
  let d: Detail
  try {
    d = await api<Detail>(`/admin/realties/${id}`, { token })
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
  const r = d.realty

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/realties" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Realties
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {r.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.logo_url} alt="" className="h-12 w-auto max-w-[160px] object-contain" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{r.name}</h1>
              {r.status === "active" ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Active</span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">Invited</span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">jvconline.ph/{r.slug}{r.registered_at ? <> · registered {shortDate(r.registered_at)}</> : r.invited_at ? <> · invited {shortDate(r.invited_at)}</> : null}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {r.status === "active" ? (
            <>
              <Link href={`/${r.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900">Public page <ExternalLink className="h-3.5 w-3.5" /></Link>
              <Link href={`/${r.slug}/login`} target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900">Their login <ExternalLink className="h-3.5 w-3.5" /></Link>
            </>
          ) : (
            <ResendButton id={r.id} />
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ["People", d.people.length, `${r.agents_count} agent${r.agents_count === 1 ? "" : "s"}`],
          ["Projects", r.projects_count, `${d.projects.reduce((n, p) => n + p.units_count, 0)} units`],
          ["Offers", r.offers_count, `${d.offers.filter((o) => o.status === "active").length} active`],
          ["Offer views", d.offer_views, "buyers opening links"],
        ].map(([label, value, note]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-sm font-medium">{label}</p>
            <p className="text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold">Company</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">Contact</dt><dd>{r.contact_name ?? "—"}</dd></div>
            <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">Email</dt><dd>{r.email ?? "—"}</dd></div>
            <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">Phone</dt><dd>{r.phone ?? "—"}</dd></div>
            <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">Address</dt><dd>{r.address ?? "—"}</dd></div>
            {r.about && <div className="flex gap-3"><dt className="w-20 shrink-0 text-slate-400">About</dt><dd className="whitespace-pre-line text-slate-600">{r.about}</dd></div>}
          </dl>
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">People ({d.people.length})</h2>
          <ul className="divide-y divide-slate-100">
            {d.people.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">{p.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${p.role === "realty" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>{p.role === "realty" ? "Staff" : "Agent"}</span>
              </li>
            ))}
            {d.people.length === 0 && <li className="px-6 py-6 text-center text-sm text-slate-500">No logins yet.</li>}
          </ul>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">Projects ({d.projects.length})</h2>
        <ul className="divide-y divide-slate-100">
          {d.projects.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 sm:px-6">
              <div>
                <p className="text-sm font-medium">{p.name}{p.status === "archived" && <span className="ml-2 text-xs text-slate-400">archived</span>}</p>
                {p.location && <p className="text-xs text-slate-500">{p.location}</p>}
              </div>
              <p className="text-xs text-slate-500">{p.units_count} unit{p.units_count === 1 ? "" : "s"} · {p.payment_plans_count} plan{p.payment_plans_count === 1 ? "" : "s"} · {p.offers_count} offer{p.offers_count === 1 ? "" : "s"}</p>
            </li>
          ))}
          {d.projects.length === 0 && <li className="px-6 py-6 text-center text-sm text-slate-500">No projects yet.</li>}
        </ul>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">Latest offers</h2>
        <ul className="divide-y divide-slate-100">
          {d.offers.map((o) => (
            <li key={o.id} className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 sm:px-6 ${o.status === "void" ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <p className="text-sm font-medium">{o.buyer_name} <span className="ml-1 font-mono text-xs text-slate-400">{o.code}</span>{o.status === "void" && <span className="ml-2 text-xs text-slate-400">void</span>}</p>
                <p className="text-xs text-slate-500">{o.project} · {o.unit} · {php(o.price)}{o.agent && <> · by {o.agent}</>} · {shortDate(o.created_at)}</p>
              </div>
              <a href={o.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"><Eye className="h-3.5 w-3.5" /> {o.views} · open <ExternalLink className="h-3.5 w-3.5" /></a>
            </li>
          ))}
          {d.offers.length === 0 && <li className="px-6 py-6 text-center text-sm text-slate-500">No offers yet.</li>}
        </ul>
      </section>
    </div>
  )
}
