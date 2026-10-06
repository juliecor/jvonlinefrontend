import type { Metadata } from "next"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { RealtyMark } from "@/components/form"
import { realtyBySlug, requireRealtyUser } from "@/lib/realty-auth"
import { signOutRealty } from "../login/actions"
import { RealtyNav } from "./nav"

type Props = { children: React.ReactNode; params: Promise<{ realty: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realty = await realtyBySlug((await params).realty)
  return { title: { default: `Dashboard · ${realty.name}`, template: `%s · ${realty.name}` }, robots: { index: false, follow: false } }
}

/** jvconline.ph/<realty>/dashboard — the realty's own space, in its own branding. Staff and agents share the shell; the nav differs. */
export default async function RealtyDashboardLayout({ children, params }: Props) {
  const { realty: slug } = await params
  const { user } = await requireRealtyUser(slug)
  const realty = user.realty

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-8">
          <Link href={`/${slug}/dashboard`} className="flex items-center gap-3">
            <RealtyMark name={realty.name} logo={realty.logo_url} className="h-9" />
          </Link>
          <RealtyNav slug={slug} role={user.role} />
          <div className="ml-auto flex items-center gap-3">
            <Link href={`/${slug}`} target="_blank" className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 sm:inline-flex">
              Public page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{user.role === "realty" ? "Realty staff" : "Agent"}</p>
            </div>
            <form action={signOutRealty.bind(null, slug)}>
              <button type="submit" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 transition hover:border-slate-900 hover:text-slate-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      <p className="pb-8 text-center text-xs text-slate-400">
        Powered by <Link href="/" className="font-medium text-slate-500 hover:text-slate-900">jvonline</Link>
      </p>
    </div>
  )
}
