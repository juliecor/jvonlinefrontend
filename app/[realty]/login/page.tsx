import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Alert, RealtyMark } from "@/components/form"
import { currentRealtyUser, realtyBySlug } from "@/lib/realty-auth"
import { realtyIcons } from "@/lib/realty-icon"
import { RealtyLoginForm } from "./login-form"

type Props = { params: Promise<{ realty: string }>; searchParams: Promise<{ registered?: string; joined?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realty = await realtyBySlug((await params).realty)
  return { title: `Sign in · ${realty.name}`, robots: { index: false, follow: false }, icons: realtyIcons(realty.slug) }
}

/** jvconline.ph/<realty>/login — the realty's own door, with its logo. Staff and agents both sign in here. */
export default async function RealtyLoginPage({ params, searchParams }: Props) {
  const { realty: slug } = await params
  const [realty, session, query] = await Promise.all([realtyBySlug(slug), currentRealtyUser(), searchParams])
  if (session?.user.realty.slug === slug) redirect(`/${slug}/dashboard`)

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href={`/${slug}`} className="flex justify-center">
            <RealtyMark name={realty.name} logo={realty.logo_url} className="h-16" />
          </Link>
          {realty.logo_url && <p className="mt-4 text-sm font-medium text-slate-700">{realty.name}</p>}
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Realty &amp; agent sign in</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] sm:p-8">
          {query.registered && (
            <div className="mb-5">
              <Alert kind="success">Your realty is registered. Sign in to open your dashboard.</Alert>
            </div>
          )}
          {query.joined && (
            <div className="mb-5">
              <Alert kind="success">Your password is set. Sign in to get started.</Alert>
            </div>
          )}
          <RealtyLoginForm slug={slug} />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Powered by <Link href="/platform" className="font-medium text-slate-500 hover:text-slate-900">jvconline</Link>
        </p>
      </div>
    </main>
  )
}
