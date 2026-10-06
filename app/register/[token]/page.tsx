import type { Metadata } from "next"
import Link from "next/link"
import { ApiError, api } from "@/lib/api"
import type { PublicRealty } from "@/lib/realty-auth"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = { title: "Register your realty · jvconline", robots: { index: false, follow: false } }

type Invite = { realty: PublicRealty; email: string }

/** jvconline.ph/register/<token> — where the invite email lands. The token alone identifies the realty. */
export default async function RegisterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  let invite: Invite | null = null
  let problem: string | null = null
  try {
    invite = await api<Invite>(`/register/${encodeURIComponent(token)}`)
  } catch (e) {
    problem = e instanceof ApiError && (e.status === 404 || e.status === 410) ? e.message : "We couldn't check this link right now. Please try again in a moment."
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold tracking-tight">
          jvconline<span className="text-slate-400">.ph</span>
        </p>

        {invite ? (
          <>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome, {invite.realty.name}.</h1>
            <p className="mt-3 text-slate-600">
              Your page will be at <span className="font-medium text-slate-900">jvconline.ph/{invite.realty.slug}</span>. Tell us about your company and set up the login you&apos;ll use to run it.
            </p>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <RegisterForm token={token} realtyName={invite.realty.name} email={invite.email} />
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
            <h1 className="text-2xl font-semibold tracking-tight">This link doesn&apos;t work</h1>
            <p className="mt-3 text-slate-600">{problem}</p>
            <Link href="/platform" className="mt-6 inline-block text-sm font-semibold text-slate-900 underline-offset-4 hover:underline">
              Back to jvconline
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
