import type { Metadata } from "next"
import type { ViewRealty } from "@/components/role-switch"
import { requireAdmin } from "@/lib/admin-auth"
import { api } from "@/lib/api"
import { signOutAdmin } from "../login/actions"
import { type AdminCounts, AdminShell } from "./shell"

export const metadata: Metadata = { title: { default: "Admin · jvconline", template: "%s · jvconline admin" }, robots: { index: false, follow: false } }

type Stats = { realties_active: number; realties_invited: number; realty_users: number; agents: number; offers_active: number }

/** Everything under /admin except the login: checks the session, draws the same frame realties have, in jvconline's ink. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token } = await requireAdmin()
  const [counts, realties] = await Promise.all([
    api<Stats>("/admin/stats", { token })
      .then((s): AdminCounts => ({ realties: s.realties_active, invited: s.realties_invited, people: s.realty_users + s.agents, offers: s.offers_active }))
      .catch(() => null),
    // Super admins can switch into any realty's dashboard as its admin or an agent.
    user.is_superadmin ? api<{ realties: ViewRealty[] }>("/auth/view-as", { token }).then((r) => r.realties).catch(() => []) : Promise.resolve(null),
  ])

  return (
    <div style={{ ["--accent" as string]: "#17150f" }}>
      <AdminShell user={user} counts={counts} realties={realties} signOutAction={signOutAdmin}>
        {children}
      </AdminShell>
    </div>
  )
}
