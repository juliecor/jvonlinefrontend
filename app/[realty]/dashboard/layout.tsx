import type { Metadata } from "next"
import { Instrument_Serif } from "next/font/google"
import { api } from "@/lib/api"
import { realtyBySlug, requireRealtyUser } from "@/lib/realty-auth"
import { signOutRealty } from "../login/actions"
import { DashboardShell, type ShellCounts } from "./shell"

const displayFont = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" })

type Props = { children: React.ReactNode; params: Promise<{ realty: string }> }
type Stats = { projects: number; offers: number; agents: number; agents_invited: number; public_projects: number }

/** Relative luminance of a #rrggbb colour (WCAG). */
function luminance(hex: string): number {
  const c = hex.replace("#", "").match(/../g)?.map((h) => parseInt(h, 16) / 255) ?? [0, 0, 0]
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

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
    <div
      className={displayFont.variable}
      style={{
        ["--accent" as string]: accent,
        // On the dark sidebar a near-black brand colour would disappear, so it uses a light stand-in there.
        ["--side-accent" as string]: luminance(accent) < 0.05 ? "#ece8e1" : accent,
        ["--side-accent-fg" as string]: luminance(accent) < 0.05 ? "#17150f" : "#ffffff",
      }}
    >
      <DashboardShell slug={slug} user={user} counts={counts} signOutAction={signOutRealty.bind(null, slug)}>
        {children}
      </DashboardShell>
    </div>
  )
}
