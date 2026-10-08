import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Lock } from "lucide-react"
import { RealtyMark } from "@/components/form"
import { currentRealtyUser, realtyBySlug } from "@/lib/realty-auth"
import { realtyIcons } from "@/lib/realty-icon"
import { signOutRealty } from "../login/actions"
import { PasswordForm } from "./password-form"

type Props = { params: Promise<{ realty: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realty = await realtyBySlug((await params).realty)
  return { title: `Choose a new password · ${realty.name}`, robots: { index: false, follow: false }, icons: realtyIcons(realty.slug) }
}

/**
 * jvconline.ph/<realty>/password — an accepted realty's first sign-in. It arrives with the temporary
 * password from its email and has to choose its own before the dashboard opens. Outside the dashboard
 * on purpose: the dashboard sends people here, so this page must not send them back.
 */
export default async function ChoosePasswordPage({ params }: Props) {
  const { realty: slug } = await params
  const [realty, session] = await Promise.all([realtyBySlug(slug), currentRealtyUser()])
  if (!session || session.user.realty.slug !== slug) redirect(`/${slug}/login`)
  if (!session.user.must_change_password) redirect(`/${slug}/dashboard`)

  const accent = realty.accent_color ?? "#1f2937"

  return (
    <main style={{ ["--accent" as string]: accent }} className="flex min-h-screen items-center justify-center bg-[#f6f4f0] px-5 py-12 text-[#17150f]">
      <div className="w-full max-w-[480px] border border-[#e6e2db] bg-white shadow-[0_18px_48px_-24px_rgba(23,21,15,0.35)]">
        <div aria-hidden className="h-1.5 bg-[var(--accent)]" />
        <div className="px-6 pb-8 pt-8 sm:px-10">
          <RealtyMark name={realty.name} logo={realty.logo_url} className="h-12" />
          {realty.developer && (
            <p className="mt-3 text-sm font-bold text-[#17150f]">
              {realty.name} <span className="font-normal text-[#6b665d]">· accredited by {realty.developer.name}</span>
            </p>
          )}

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">First sign-in</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Choose your own password.</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5a554d]">
            You signed in with the temporary password from your accreditation email. Replace it with one only you know to open your dashboard.
          </p>

          <div className="mt-8">
            <PasswordForm slug={slug} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e2db] pt-5 text-xs text-[#8a847a]">
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0" /> Signed in as {session.user.email}
            </span>
            <form action={signOutRealty.bind(null, slug)}>
              <button type="submit" className="font-semibold text-[#6b665d] underline-offset-4 hover:text-[#17150f] hover:underline">
                Not you? Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
      <p className="sr-only">
        Powered by <Link href="/platform">jvconline</Link>
      </p>
    </main>
  )
}
