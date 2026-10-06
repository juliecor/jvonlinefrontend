import Link from "next/link"
import { api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"
import { shortDate } from "@/lib/format"

export const metadata = { title: "People" }

type Person = { id: number; name: string; email: string; role: "realty" | "agent"; joined_at: string; offers_count: number; realty: { id: number; name: string; slug: string } | null }
type Realty = { id: number; name: string }

function List({ title, rows }: { title: string; rows: Person[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">{title} ({rows.length})</h2>
      <ul className="divide-y divide-slate-100">
        {rows.map((p) => (
          <li key={p.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="truncate text-xs text-slate-500">{p.email}{p.realty && <> · <Link href={`/admin/realties/${p.realty.id}`} className="hover:text-slate-900 hover:underline">{p.realty.name}</Link></>}</p>
            </div>
            <p className="shrink-0 text-xs text-slate-400">{p.offers_count} active offer{p.offers_count === 1 ? "" : "s"} · joined {shortDate(p.joined_at)}</p>
          </li>
        ))}
        {rows.length === 0 && <li className="px-6 py-6 text-center text-sm text-slate-500">Nobody yet.</li>}
      </ul>
    </section>
  )
}

/** jvconline.ph/admin/people — every realty staff member and agent, with their realty. */
export default async function AdminPeoplePage({ searchParams }: { searchParams: Promise<{ realty?: string }> }) {
  const { token } = await requireAdmin()
  const { realty } = await searchParams
  const [people, realties] = await Promise.all([
    api<Person[]>(`/admin/people${realty ? `?realty_id=${encodeURIComponent(realty)}` : ""}`, { token }),
    api<Realty[]>("/admin/realties", { token }),
  ])
  const staff = people.filter((p) => p.role === "realty")
  const agents = people.filter((p) => p.role === "agent")

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">People</h1>
          <p className="mt-1 text-sm text-slate-500">Realty staff and agents across the platform. Realties manage their own people; this is the overview.</p>
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
      <div className="mt-8 space-y-6">
        <List title="Agents" rows={agents} />
        <List title="Realty staff" rows={staff} />
      </div>
    </div>
  )
}
