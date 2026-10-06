import Link from "next/link"
import { Building2, Clock, Eye, FileText, Home, UserPlus, UserRound, Users } from "lucide-react"
import { api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"
import { shortDate } from "@/lib/format"

export const metadata = { title: "Dashboard" }

type Stats = {
  realties: number
  realties_active: number
  realties_invited: number
  realty_users: number
  agents: number
  projects: number
  units: number
  offers_active: number
  offers_total: number
  offer_views: number
  recent: { kind: string; at: string; realty: string | null; realty_id: number | null; text: string; code?: string }[]
}

const KIND_ICON = { realty_registered: Building2, realty_invited: Clock, agent_joined: UserPlus, project_added: Home, offer_created: FileText } as const

/** jvconline.ph/admin — the numbers across every realty, and what happened lately. */
export default async function AdminDashboardPage() {
  const { user, token } = await requireAdmin()
  const s = await api<Stats>("/admin/stats", { token })

  const tiles = [
    { label: "Realties", value: s.realties, note: `${s.realties_active} active · ${s.realties_invited} invited`, icon: Building2, href: "/admin/realties" },
    { label: "Realty staff", value: s.realty_users, note: "logins across realties", icon: UserRound, href: "/admin/people" },
    { label: "Agents", value: s.agents, note: "invited by their realty", icon: Users, href: "/admin/people" },
    { label: "Projects", value: s.projects, note: `${s.units} unit${s.units === 1 ? "" : "s"} listed`, icon: Home, href: "/admin/realties" },
    { label: "Active offers", value: s.offers_active, note: `${s.offers_total} sent in total`, icon: FileText, href: "/admin/offers" },
    { label: "Offer views", value: s.offer_views, note: "buyers opening their links", icon: Eye, href: "/admin/offers" },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm text-slate-500">Welcome back, {user.name.split(" ")[0]}.</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ label, value, note, icon: Icon, href }) => (
          <Link key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400">
            <Icon className="h-5 w-5 text-slate-400" />
            <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">{value.toLocaleString("en-PH")}</p>
            <p className="mt-1 text-sm font-medium">{label}</p>
            <p className="text-xs text-slate-500">{note}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">Latest activity</h2>
        <ul className="divide-y divide-slate-100">
          {s.recent.map((e, i) => {
            const Icon = KIND_ICON[e.kind as keyof typeof KIND_ICON] ?? FileText
            return (
              <li key={i} className="flex items-start gap-3 px-5 py-3 sm:px-6">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{e.text}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {shortDate(e.at)}
                    {e.realty_id && <> · <Link href={`/admin/realties/${e.realty_id}`} className="hover:text-slate-900 hover:underline">{e.realty}</Link></>}
                    {e.code && <> · <a href={`/offer/${e.code}`} target="_blank" className="font-mono hover:text-slate-900 hover:underline">{e.code}</a></>}
                  </p>
                </div>
              </li>
            )
          })}
          {s.recent.length === 0 && <li className="px-6 py-10 text-center text-sm text-slate-500">Nothing yet.</li>}
        </ul>
      </section>
    </div>
  )
}
