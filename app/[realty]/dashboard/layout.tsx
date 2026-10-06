import type { Metadata } from "next"
import { api } from "@/lib/api"
import { realtyBySlug, requireRealtyUser } from "@/lib/realty-auth"
import { signOutRealty } from "../login/actions"
import { DashboardShell, type ShellCounts } from "./shell"

type Props = { children: React.ReactNode; params: Promise<{ realty: string }> }
type Stats = { projects: number; offers: number; agents: number; agents_invited: number; public_projects: number }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realty = await realtyBySlug((await params).realty)
  return { title: { default: `Dashboard · ${realty.name}`, template: `%s · ${realty.name}` }, robots: { index: false, follow: false } }
}

/**
 * jvconline.ph/<realty>/dashboard — the realty's own space. Its logo and brand
 * colour (--accent) tint the shell; staff and agents share it, the nav differs.
 */
export default async function RealtyDashboardLayout({ children, params }: Props) {
  const { realty: slug } = await params
  const { user, token } = await requireRealtyUser(slug)
  const accent = user.realty.accent_color ?? "#1f2937"
  // The sidebar's counts; the dashboard still works if they can't be read.
  const counts: ShellCounts | null = await api<{ stats: Stats }>("/realty/overview", { token })
    .then(({ stats: s }) => ({ projects: s.projects, offers: s.offers, agents: s.agents, agentsInvited: s.agents_invited, publicProjects: s.public_projects }))
    .catch(() => null)

  return (
    <div style={{ ["--accent" as string]: accent }}>
      <DashboardShell slug={slug} user={user} counts={counts} signOutAction={signOutRealty.bind(null, slug)}>
        {children}
      </DashboardShell>
    </div>
  )
}
