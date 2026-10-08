"use client"

import { useState, useTransition } from "react"
import { AlertCircle, BadgeCheck, Check, CircleCheck, LoaderCircle, MailWarning, RotateCw, X } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { shortDate } from "@/lib/format"
import { type LoginResult, acceptAccreditation, rejectAccreditation, resendLoginDetails } from "../actions"

type Props = {
  slug: string
  id: number
  status: "submitted" | "approved" | "rejected"
  firm: string
  loginEmail: string
  realty: { id: number; name: string; slug: string; login_url: string } | null
  loginPending: boolean
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
}

/**
 * The decision. Pending: accept (asks once more, since it makes the realty and emails its login)
 * or turn it down with a reason. Accepted: where the realty signs in, and a way to resend the login.
 */
export function DecisionPanel(p: Props) {
  const [pending, start] = useTransition()
  const [mode, setMode] = useState<"idle" | "accept" | "reject">("idle")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string>()
  const [login, setLogin] = useState<LoginResult | null>(null)

  const accept = () =>
    start(async () => {
      const r = await acceptAccreditation(p.slug, p.id)
      setError(r.error)
      if (r.login) setLogin(r.login)
      if (!r.error) setMode("idle")
    })
  const reject = () =>
    start(async () => {
      const r = await rejectAccreditation(p.slug, p.id, note)
      setError(r.error)
      if (!r.error) setMode("idle")
    })
  const resend = () =>
    start(async () => {
      const r = await resendLoginDetails(p.slug, p.id)
      setError(r.error)
      if (r.login) setLogin(r.login)
    })

  // What happened to the login email just now; kept on screen because a password that couldn't be mailed is shown only here.
  const result = login && (
    <div className={`mt-5 border-l-4 p-4 ${login.emailed ? "border-emerald-600 bg-white" : "border-amber-500 bg-amber-50"}`}>
      <p className={`flex items-center gap-2 text-sm font-bold ${login.emailed ? "text-emerald-900" : "text-amber-900"}`}>
        {login.emailed ? <CircleCheck className="h-5 w-5 text-emerald-700" /> : <MailWarning className="h-5 w-5 text-amber-700" />}
        {login.emailed ? `Login details emailed to ${login.username}.` : `We couldn't email ${login.username}. Give them these yourself:`}
      </p>
      {!login.emailed && login.temporary_password && (
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex flex-wrap gap-x-3">
            <dt className="w-40 text-[#6b665d]">Sign-in page</dt>
            <dd className="font-semibold">{login.login_url}</dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt className="w-40 text-[#6b665d]">Username</dt>
            <dd className="font-semibold">{login.username}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-3">
            <dt className="w-40 text-[#6b665d]">Temporary password</dt>
            <dd className="flex items-center gap-2">
              <code className="rounded bg-white px-2 py-1 font-mono text-[15px] font-bold tracking-wide">{login.temporary_password}</code>
              <CopyButton text={login.temporary_password} label="Copy" className="bg-white" />
            </dd>
          </div>
          <p className="pt-2 text-xs text-amber-900">It is shown only now. They have to choose their own password the first time they sign in.</p>
        </dl>
      )}
    </div>
  )

  if (p.status === "approved") {
    return (
      <section className="mt-8 border-2 border-emerald-200 bg-emerald-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold tracking-tight text-emerald-950">Accepted{p.reviewedBy ? ` by ${p.reviewedBy}` : ""}</p>
            <p className="mt-1 text-sm text-emerald-900">
              {p.reviewedAt ? `${shortDate(p.reviewedAt)} · ` : ""}
              {p.realty ? (
                <>
                  {p.realty.name} signs in at <span className="font-semibold">{p.realty.login_url.replace(/^https?:\/\//, "")}</span> with <span className="font-semibold">{p.loginEmail}</span>.
                </>
              ) : (
                "The realty was set up."
              )}
            </p>
            <p className="mt-1 text-sm text-emerald-900">{p.loginPending ? "They haven't signed in yet. They will be asked to choose their own password." : "They have signed in and chosen their own password."}</p>
            {p.loginPending && (
              <button type="button" onClick={resend} disabled={pending} className="mt-3 inline-flex items-center gap-1.5 border border-emerald-700/40 bg-white px-3 py-2 text-xs font-bold text-emerald-900 hover:border-emerald-800 disabled:opacity-60">
                {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />} Resend login details
              </button>
            )}
            {error && <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
            {result}
          </div>
        </div>
      </section>
    )
  }

  if (p.status === "rejected") {
    return (
      <section className="mt-8 border-2 border-red-200 bg-red-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />
          <div>
            <p className="text-xl font-bold tracking-tight text-red-950">Not accepted{p.reviewedBy ? ` · ${p.reviewedBy}` : ""}</p>
            <p className="mt-1 text-sm text-red-900">{p.reviewedAt ? shortDate(p.reviewedAt) : ""}</p>
            {p.reviewNote && <p className="mt-3 border-l-4 border-red-500 bg-white px-4 py-2.5 text-[15px] font-semibold text-red-800">{p.reviewNote}</p>}
            <p className="mt-3 text-sm text-red-900">To give them another go, invite the same email again from the Realties page.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8 border-2 border-amber-300 bg-amber-50 p-5 sm:p-6">
      <p className="text-xl font-bold tracking-tight">Waiting for your decision</p>
      <p className="mt-1 text-sm text-[#3d3a34]">
        Read the form and open the documents below. Accepting makes <strong>{p.firm}</strong> an accredited realty with its own sign-in, and emails <strong>{p.loginEmail}</strong> a username and a temporary password.
      </p>

      {mode === "idle" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode("accept")} className="inline-flex items-center gap-1.5 bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
            <Check className="h-4 w-4" strokeWidth={3} /> Accept
          </button>
          <button type="button" onClick={() => setMode("reject")} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-red-400 hover:text-red-700">
            <X className="h-4 w-4" /> Turn down
          </button>
        </div>
      )}

      {mode === "accept" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border border-emerald-300 bg-white px-4 py-3">
          <span className="text-sm font-semibold text-[#3d3a34]">Accept {p.firm} and email its login?</span>
          <button type="button" onClick={accept} disabled={pending} className="inline-flex items-center gap-1.5 bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
            {pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />} Yes, accept
          </button>
          <button type="button" disabled={pending} onClick={() => setMode("idle")} className="px-2 py-2 text-xs font-semibold text-[#8a847a] hover:text-[#17150f]">
            Cancel
          </button>
        </div>
      )}

      {mode === "reject" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            reject()
          }}
        >
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]">Why not? (kept on record, not emailed)</span>
            <textarea autoFocus required rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The PRC registration is unreadable." className="mt-1.5 block w-full border border-[#d9d4cb] bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15" />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Turn down
            </button>
            <button type="button" disabled={pending} onClick={() => setMode("idle")} className="px-2 py-2.5 text-sm font-semibold text-[#8a847a] hover:text-[#17150f]">
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
      {result}
    </section>
  )
}
