import type { Metadata } from "next"
import { Instrument_Serif } from "next/font/google"
import { realtyBySlug, requireRealtyUser } from "@/lib/realty-auth"
import { signOutRealty } from "../login/actions"
import { DashboardShell } from "./shell"

const displayFont = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" })

type Props = { children: React.ReactNode; params: Promise<{ realty: string }> }

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
  const { user } = await requireRealtyUser(slug)
  const accent = user.realty.accent_color ?? "#1f2937"

  return (
    <div className={displayFont.variable} style={{ ["--accent" as string]: accent }}>
      <DashboardShell
        slug={slug}
        user={user}
        signOut={
          <form action={signOutRealty.bind(null, slug)}>
            <button type="submit" className="text-xs font-semibold text-[#6b665d] hover:text-[var(--accent)]">
              Sign out
            </button>
          </form>
        }
      >
        {children}
      </DashboardShell>
    </div>
  )
}
