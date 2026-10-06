import Link from "next/link"
import { ArrowRight, Building2, Clock, UserRound, Users } from "lucide-react"
import { api } from "@/lib/api"
import { requireAdmin } from "@/lib/admin-auth"

export const metadata = { title: "Dashboard" }

type Stats = { realties: number; realties_active: number; realties_invited: number; realty_users: number; agents: number }

/** jvconline.ph/admin — the numbers across every realty. */
export default async function AdminDashboardPage() {
  const { user, token } = await requireAdmin()
  const stats = await api<Stats>("/admin/stats", { token })

  const tiles = [
    { label: "Realties", value: stats.realties, note: `${stats.realties_active} active`, icon: Building2 },
    { label: "Invites pending", value: stats.realties_invited, note: "waiting to register", icon: Clock },
    { label: "Realty staff", value: stats.realty_users, note: "logins across realties", icon: UserRound },
    { label: "Agents", value: stats.agents, note: "invited by their realty", icon: Users },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm text-slate-500">Welcome back, {user.name.split(" ")[0]}.</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, note, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <Icon className="h-5 w-5 text-slate-400" />
            <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-sm font-medium">{label}</p>
            <p className="text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-semibold">Realties</h2>
        <p className="mt-1 text-sm text-slate-500">Invite a realty, follow up on invites, open their pages.</p>
        <Link href="/admin/realties" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
          Go to Realties <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
