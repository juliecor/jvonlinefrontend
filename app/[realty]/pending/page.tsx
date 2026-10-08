import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CircleCheck, Clock, Lock, MailCheck, XCircle } from "lucide-react"
import { RealtyMark } from "@/components/form"
import { applicantSession, realtyBySlug } from "@/lib/realty-auth"
import { realtyIcons } from "@/lib/realty-icon"
import { signOutRealty } from "../login/actions"
import { PendingStatus } from "./pending-status"

type Props = { params: Promise<{ realty: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realty = await realtyBySlug((await params).realty)
  return { title: `Your application · ${realty.name}`, robots: { index: false, follow: false }, icons: realtyIcons(realty.slug) }
}

/**
 * jvconline.ph/<realty>/pending — where an agent lands after "Send application". They are signed in but
 * the dashboard is shut until the realty's staff decide: this page says so, checks again by itself, and
 * turns into an "Open my dashboard" button the moment they are approved.
 */
export default async function PendingApplicationPage({ params }: Props) {
  const { realty: slug } = await params
  const [realty, session] = await Promise.all([realtyBySlug(slug), applicantSession()])
  // The session ends when a rejection revokes it, or it simply runs out: the sign-in page says so.
  if (!session || session.user.realty.slug !== slug) redirect(`/${slug}/login?ended=1`)

  const { user } = session
  const approved = user.status === "active"
  const rejected = user.status === "rejected"
  const accent = realty.accent_color ?? "#1f2937"

  return (
    <main style={{ ["--accent" as string]: accent }} className="flex min-h-screen items-center justify-center bg-[#f6f4f0] px-5 py-12 text-[#17150f]">
      <div className="w-full max-w-[500px] border border-[#e6e2db] bg-white shadow-[0_18px_48px_-24px_rgba(23,21,15,0.35)]">
        <div aria-hidden className="h-1.5 bg-[var(--accent)]" />
        <div className="px-6 pb-8 pt-8 sm:px-10">
          <RealtyMark name={realty.name} logo={realty.logo_url} className="h-12" />
          {realty.developer && (
            <p className="mt-3 text-sm font-bold text-[#17150f]">
              {realty.name} <span className="font-normal text-[#6b665d]">· accredited by {realty.developer.name}</span>
            </p>
          )}

          {approved ? (
            <>
              <CircleCheck className="mt-8 h-10 w-10 text-emerald-700" />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Approved</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">You&apos;re in, {user.name.split(" ")[0]}.</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5a554d]">{realty.name} approved your application. Your dashboard is open.</p>
              <Link href={`/${slug}/dashboard`} className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] px-6 py-4 text-base font-bold text-white transition hover:brightness-110">
                Open my dashboard <ArrowRight className="h-5 w-5" />
              </Link>
            </>
          ) : rejected ? (
            <>
              <XCircle className="mt-8 h-10 w-10 text-red-700" />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-red-800">Not approved</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Your application wasn&apos;t approved.</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5a554d]">{realty.name} decided not to approve it this time. If you think it was a mistake, get in touch with them directly.</p>
            </>
          ) : (
            <>
              <span className="mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <Clock className="h-6 w-6" />
              </span>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Application sent</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Your application is pending.</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5a554d]">
                {realty.name} has been told and will review it. Your account opens as soon as they approve you, and we email you the moment they decide. You can leave this page open or come back to it.
              </p>

              <dl className="mt-6 space-y-2 border-l-4 border-[#e6e2db] bg-[#faf8f5] px-4 py-3 text-sm">
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-[#6b665d]">Name</dt>
                  <dd className="min-w-0 break-words font-semibold">{user.name}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-[#6b665d]">Email</dt>
                  <dd className="min-w-0 break-all font-semibold">{user.email}</dd>
                </div>
              </dl>
              <p className="mt-4 flex items-start gap-2 text-sm text-[#6b665d]">
                <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" /> You&apos;ll sign in with this email and the password you chose.
              </p>

              <div className="mt-6">
                <PendingStatus waiting />
              </div>
            </>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e2db] pt-5 text-xs text-[#8a847a]">
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0" /> Signed in as {user.email}
            </span>
            <form action={signOutRealty.bind(null, slug)}>
              <button type="submit" className="font-bold text-[#6b665d] underline-offset-4 hover:text-[#17150f] hover:underline">
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
