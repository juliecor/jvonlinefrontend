import type { Metadata } from "next"
import type { ViewRealty } from "@/components/role-switch"
import { api } from "@/lib/api"
import { realtyBySlug, requireRealtyUser } from "@/lib/realty-auth"
import { realtyIcons } from "@/lib/realty-icon"
import { signOutRealty } from "../login/actions"
import { DashboardShell, type ShellCounts, type SuperAdminNav } from "./shell"

type Props = { children: React.ReactNode; modal: React.ReactNode; params: Promise<{ realty: string }> }
type Stats = { projects: number; offers: number; agents: number; agents_invited: number; agents_pending: number; public_projects: number; new_responses: number; docs_to_review: number; to_approve: number; sent_back: number; realties_pending?: number }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realty = await realtyBySlug((await params).realty)
  return { title: { default: `Dashboard · ${realty.name}`, template: `%s · ${realty.name}` }, robots: { index: false, follow: false }, icons: realtyIcons(realty.slug, realty.kind) }
}

/**
 * jvconline.ph/<realty>/dashboard — the realty's own space. Its logo and brand
 * colour (--accent) tint the shell; staff and agents share it, the nav differs.
 */
export default async function RealtyDashboardLayout({ children, modal, params }: Props) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const accent = user.realty.accent_color ?? "#1f2937"
  // The sidebar's counts; the dashboard still works if they can't be read.
  const counts: ShellCounts | null = await api<{ stats: Stats }>("/realty/overview", { token })
    .then(({ stats: s }) => ({ projects: s.projects, offers: s.offers, agents: s.agents, agentsInvited: s.agents_invited, agentsPending: s.agents_pending ?? 0, publicProjects: s.public_projects, newResponses: s.new_responses + s.docs_to_review + s.sent_back, toApprove: s.to_approve, realtiesPending: s.realties_pending ?? 0 }))
    .catch(() => null)
  // A super admin gets this realty's dashboard plus the platform's realties and people, and View as.
  const superAdmin: SuperAdminNav | null = user.is_superadmin
    ? await Promise.all([
        api<{ realties: ViewRealty[] }>("/auth/view-as", { token }).then((r) => r.realties).catch(() => []),
        api<{ realties_active: number; realty_users: number; agents: number }>("/admin/stats", { token }).catch(() => null),
      ]).then(([realties, s]) => ({ realties, realtyCount: s?.realties_active ?? null, peopleCount: s ? s.realty_users + s.agents : null }))
    : null

  return (
    <div style={{ ["--accent" as string]: accent }}>
      <DashboardShell slug={slug} user={user} counts={counts} superAdmin={superAdmin} signOutAction={signOutRealty.bind(null, slug)}>
        {children}
        {/* New offer and Add project open here, as a dialog over the current page (see @modal). */}
        {modal}
      </DashboardShell>
    </div>
  )
}
