import type { Metadata } from "next"
import Link from "next/link"
import { RealtyMark } from "@/components/form"
import { ApiError, api } from "@/lib/api"
import { type PublicRealty, realtyBySlug } from "@/lib/realty-auth"
import { JoinForm } from "./join-form"

type Props = { params: Promise<{ realty: string; token: string }> }
type Invite = { realty: PublicRealty; name: string; email: string }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const realty = await realtyBySlug((await params).realty)
  return { title: `Join ${realty.name}`, robots: { index: false, follow: false } }
}

/** jvconline.ph/<realty>/join/<token> — an invited agent picks their password. */
export default async function JoinPage({ params }: Props) {
  const { realty: slug, token } = await params
  const realty = await realtyBySlug(slug)

  let invite: Invite | null = null
  let problem: string | null = null
  try {
    invite = await api<Invite>(`/join/${encodeURIComponent(token)}`)
    if (invite.realty.slug !== slug) {
      invite = null
      problem = "This invitation is for a different realty."
    }
  } catch (e) {
    problem = e instanceof ApiError && (e.status === 404 || e.status === 410) ? e.message : "We couldn't check this link right now. Please try again in a moment."
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <RealtyMark name={realty.name} logo={realty.logo_url} className="h-16" />
          {realty.logo_url && <p className="mt-4 text-sm font-medium text-slate-700">{realty.name}</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] sm:p-8">
          {invite ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Welcome, {invite.name.split(" ")[0]}.</h1>
              <p className="mt-2 mb-6 text-sm text-slate-600">{realty.name} added you as an agent. Set a password and you&apos;re in.</p>
              <JoinForm token={token} name={invite.name} email={invite.email} />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">This link doesn&apos;t work</h1>
              <p className="mt-3 text-sm text-slate-600">{problem}</p>
              <Link href={`/${slug}/login`} className="mt-6 inline-block text-sm font-semibold text-slate-900 underline-offset-4 hover:underline">
                Go to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
