"use client"

import { useState, useTransition } from "react"
import { Eye, EyeOff, KeyRound, LoaderCircle, LockOpen, Pencil, RefreshCw } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { setBuyerLogin } from "./actions"

/**
 * The buyer's login for a private offer: the agent sets a username and a
 * password, and the buyer types them to open the link. Sent by Viber or text,
 * never in the email.
 */

// No look-alikes (0/O, 1/I/L), so the buyer can read it off a message or over the phone.
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function suggestPassword(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("")
}

export const firstWord = (name: string) => name.trim().split(/\s+/)[0] ?? ""

/** What the agent pastes into Viber or a text. */
export function loginMessage({ buyer, realty, url, username, password }: { buyer: string; realty: string; url: string; username: string; password: string }) {
  return `Hi ${firstWord(buyer) || "there"}! Here's your sales offer from ${realty}:\n${url}\n\nIt's private. Open it with:\nUsername: ${username}\nPassword: ${password}`
}

const field = "mt-1.5 block w-full border border-[#d9d4cb] bg-white px-3.5 py-2.5 text-[15px] text-[#17150f] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]"

/** Username and password inputs (named for the form), with show and "make a new one". */
export function LoginFields({ username, password, onUsername, onPassword }: { username: string; password: string; onUsername: (v: string) => void; onPassword: (v: string) => void }) {
  const [show, setShow] = useState(true)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={label}>Username</span>
        <input name="access_username" required minLength={2} maxLength={60} value={username} onChange={(e) => onUsername(e.target.value)} autoComplete="off" placeholder="e.g. Juliecor" className={field} />
      </label>
      <label className="block">
        <span className={label}>Password</span>
        <span className="relative mt-1.5 block">
          <input name="access_password" required minLength={6} maxLength={60} type={show ? "text" : "password"} value={password} onChange={(e) => onPassword(e.target.value)} autoComplete="new-password" className={`${field} mt-0 pr-20 font-mono`} />
          <span className="absolute inset-y-0 right-0 flex">
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="flex w-10 items-center justify-center text-[#8a847a] hover:text-[#17150f]">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => onPassword(suggestPassword())} aria-label="Make a new password" title="Make a new password" className="flex w-10 items-center justify-center text-[#8a847a] hover:text-[#17150f]">
              <RefreshCw className="h-4 w-4" />
            </button>
          </span>
        </span>
      </label>
    </div>
  )
}

/** The login as the agent shares it: username, password and a "Copy link & login" for Viber. */
export function LoginCard({ buyer, realty, url, username, password, children }: { buyer: string; realty: string; url: string; username: string; password: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a847a]">Username</dt>
          <dd className="mt-0.5 font-mono text-base font-bold text-[#17150f]">{username}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a847a]">Password</dt>
          <dd className="mt-0.5 font-mono text-base font-bold text-[#17150f]">{password}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2 sm:ml-auto">
        <CopyButton text={loginMessage({ buyer, realty, url, username, password })} label="Copy link & login" className="!rounded-none !border-[#17150f] !px-4 !py-2.5 !text-sm !font-bold" />
        {children}
      </div>
    </div>
  )
}

/** On the offer's page: see the buyer's login, copy it, or change it (which signs the buyer out). */
export function LoginPanel({ slug, offerId, buyer, realty, url, username, password }: { slug: string; offerId: number; buyer: string; realty: string; url: string; username: string | null; password: string | null }) {
  const locked = !!username && !!password
  const [editing, setEditing] = useState(false)
  const [u, setU] = useState(username ?? firstWord(buyer))
  const [p, setP] = useState(password ?? "")
  const [error, setError] = useState("")
  const [pending, start] = useTransition()

  const save = () =>
    start(async () => {
      const r = await setBuyerLogin(slug, offerId, u.trim(), p)
      if (r.error) setError(r.error)
      else {
        setError("")
        setEditing(false)
      }
    })

  return (
    <section className={`mt-8 border p-5 sm:p-6 ${locked ? "border-[#e0dcd5] bg-white" : "border-amber-300 bg-amber-50"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#17150f]">
          {locked ? <KeyRound className="h-4 w-4 text-[var(--accent)]" /> : <LockOpen className="h-4 w-4 text-amber-700" />}
          {locked ? "Buyer's login" : "No login yet"}
        </p>
        {!locked && !editing && <p className="w-full text-sm font-semibold text-amber-900 sm:w-auto sm:flex-1 sm:pl-2">Anyone with the link can open this offer. Give it a username and password.</p>}
      </div>

      {editing || !locked ? (
        editing ? (
          <div className="mt-4 space-y-4">
            <LoginFields username={u} password={p} onUsername={setU} onPassword={setP} />
            {locked && <p className="text-sm text-[#5a554d]">The buyer will need the new login; the old one stops working.</p>}
            {error && <p className="text-sm font-bold text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending || u.trim().length < 2 || p.length < 6} onClick={save} className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
                {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Save login
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-3 py-2.5 text-sm font-semibold text-[#6b665d] hover:text-[#17150f]">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!p) setP(suggestPassword())
              setEditing(true)
            }}
            className="mt-4 inline-flex items-center gap-2 bg-[#17150f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3d3a34]"
          >
            <KeyRound className="h-4 w-4" /> Set a username and password
          </button>
        )
      ) : (
        <div className="mt-4">
          <LoginCard buyer={buyer} realty={realty} url={url} username={username!} password={password!}>
            <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
              <Pencil className="h-4 w-4" /> Change
            </button>
          </LoginCard>
          <p className="mt-3 text-sm text-[#6b665d]">The buyer types these to open the link. Send them by Viber or text; the emailed offer doesn&apos;t include them.</p>
        </div>
      )}
    </section>
  )
}
