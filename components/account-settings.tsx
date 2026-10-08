"use client"

import { useActionState, useEffect, useState } from "react"
import { Eye, EyeOff, KeyRound, LoaderCircle, UserRound } from "lucide-react"
import { toast } from "./feedback"

export type Account = { name: string; email: string; phone: string | null; role: "admin" | "realty" | "agent"; is_superadmin: boolean; realty: string | null; member_since: string | null }
/** errors: Laravel's, one message per field. ok: changes each time a save works. */
export type AccountState = { error?: string; errors?: Record<string, string>; ok?: number }
type Action = (prev: AccountState, form: FormData) => Promise<AccountState>

const box = "block w-full border border-[#d9d4cb] bg-white px-3.5 py-3 text-[15px] text-[#17150f] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const input = `mt-1.5 ${box}`
const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#6b665d]"

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

export const roleLabel = (a: Account) => (a.is_superadmin ? "Super admin" : a.role === "admin" ? "Platform admin" : a.role === "realty" ? "Admin" : "Agent")

/**
 * The signed-in person's own account: name, email (their sign-in; changing
 * it asks for the password) and phone, then the password. Same page for
 * everyone; buyersSee says where buyers meet these details, when they do.
 */
export function AccountSettings({ account, buyersSee, save, changePassword }: { account: Account; buyersSee?: string; save: Action; changePassword: Action }) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 border border-[#e0dcd5] bg-white p-5">
        <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center bg-[var(--accent)] text-2xl font-bold text-white">{initials(account.name)}</span>
        <div className="min-w-0">
          <p className="truncate text-xl font-bold tracking-tight text-[#17150f]">{account.name}</p>
          <p className="truncate text-sm text-[#6b665d]">{account.email}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#8a847a]">
            <span className="bg-[#f1eee9] px-2 py-0.5 font-bold uppercase tracking-[0.12em] text-[#3d3a34]">{roleLabel(account)}</span>
            {account.realty && <span>{account.realty}</span>}
          </p>
        </div>
      </div>

      <Details account={account} buyersSee={buyersSee} save={save} />
      <Password changePassword={changePassword} />
    </div>
  )
}

function Details({ account, buyersSee, save }: { account: Account; buyersSee?: string; save: Action }) {
  const [state, action, pending] = useActionState(save, {})
  // Held here, so a save that fails doesn't wipe what was typed.
  const [name, setName] = useState(account.name)
  const [email, setEmail] = useState(account.email)
  const [phone, setPhone] = useState(account.phone ?? "")
  const emailChanged = email.trim().toLowerCase() !== account.email.toLowerCase()

  useEffect(() => {
    if (state.ok) toast("Your details are saved")
  }, [state.ok])

  return (
    <section className="mt-8 border border-[#e0dcd5] bg-white">
      <header className="flex items-center gap-2 border-b border-[#e6e2db] px-5 py-3.5">
        <UserRound className="h-4 w-4 text-[var(--accent)]" />
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#17150f]">Your details</h2>
      </header>
      <form action={action} className="space-y-5 p-5">
        {buyersSee && <p className="border-l-4 border-[var(--accent)] bg-[#faf8f5] px-3.5 py-2.5 text-sm text-[#3d3a34]">{buyersSee}</p>}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={label}>Full name</span>
            <input name="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={input} />
            <Problem text={state.errors?.name} />
          </label>
          <label className="block">
            <span className={label}>Email (you sign in with it)</span>
            <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={input} />
            <Problem text={state.errors?.email} />
          </label>
          <label className="block">
            <span className={label}>Mobile number</span>
            <input name="phone" type="tel" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 123 4567" autoComplete="tel" className={input} />
            <Problem text={state.errors?.phone} />
          </label>
          {emailChanged && (
            <label className="block sm:col-span-2">
              <span className={label}>Current password, to change your email</span>
              <PasswordInput name="current_password" autoComplete="current-password" required />
              <Problem text={state.errors?.current_password} />
            </label>
          )}
        </div>
        {state.error && <p role="alert" className="text-sm font-bold text-red-700">{state.error}</p>}
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Save details
        </button>
      </form>
    </section>
  )
}

function Password({ changePassword }: { changePassword: Action }) {
  const [state, action, pending] = useActionState(changePassword, {})

  useEffect(() => {
    if (state.ok) toast("Password changed. Other devices were signed out.")
  }, [state.ok])

  return (
    <section className="mt-6 border border-[#e0dcd5] bg-white">
      <header className="flex items-center gap-2 border-b border-[#e6e2db] px-5 py-3.5">
        <KeyRound className="h-4 w-4 text-[var(--accent)]" />
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#17150f]">Password</h2>
      </header>
      <form action={action} className="space-y-5 p-5">
        <p className="text-sm text-[#5a554d]">At least 8 characters. Changing it signs you out everywhere else, like on another phone or computer.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={label}>Current password</span>
            <PasswordInput name="current_password" autoComplete="current-password" required />
            <Problem text={state.errors?.current_password} />
          </label>
          <label className="block">
            <span className={label}>New password</span>
            <PasswordInput name="password" autoComplete="new-password" required minLength={8} />
            <Problem text={state.errors?.password} />
          </label>
          <label className="block">
            <span className={label}>New password again</span>
            <PasswordInput name="password_confirmation" autoComplete="new-password" required minLength={8} />
          </label>
        </div>
        {state.error && <p role="alert" className="text-sm font-bold text-red-700">{state.error}</p>}
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 bg-[#17150f] px-5 py-3 text-[15px] font-bold text-white transition hover:bg-black disabled:opacity-60">
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Change password
        </button>
      </form>
    </section>
  )
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false)
  return (
    <span className="relative mt-1.5 block">
      <input {...props} type={shown ? "text" : "password"} className={`${box} pr-12`} />
      <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8a847a] transition hover:text-[#17150f]">
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </span>
  )
}

function Problem({ text }: { text?: string }) {
  return text ? <span className="mt-1.5 block text-sm font-semibold text-red-700">{text}</span> : null
}
