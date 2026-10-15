"use client"

import { useState, useTransition } from "react"
import { Check, Copy, Eye, EyeOff, KeyRound, LoaderCircle, Power, RefreshCw, ShieldCheck, SlidersHorizontal, Trash2, UserPlus } from "lucide-react"
import { Tag } from "@/components/dashboard-ui"
import { confirmAction, toast } from "@/components/feedback"
import { Modal } from "@/components/modal"
import { timeAgo } from "@/lib/format"
import { suggestPassword } from "../offers/buyer-login"
import { type Access, type StaffResult, addStaff, deleteStaff, resetPassword, setAccess, setStatus } from "./actions"

export type StaffMember = {
  id: number
  name: string
  email: string
  phone: string | null
  full_admin: boolean
  sections: string[]
  status: "active" | "disabled"
  must_change_password: boolean
  last_login_at: string | null
  offers: number
  is_you: boolean
}

type Info = Record<string, { label: string; text: string }>

const box = "block w-full rounded-xl border border-[#d9d4cb] bg-white px-3.5 py-3 text-[15px] text-[#17150f] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const input = `mt-1.5 ${box}`
const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#6b665d]"
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

/**
 * Team > Staff: everyone with a staff account, what each can open, when they
 * last signed in, and the admin's tools: add, edit access, reset password,
 * turn off or on, delete. Your own row is managed on My account.
 */
export function StaffManager({ slug, realty, loginUrl, sections, info, staff }: { slug: string; realty: string; loginUrl: string; sections: string[]; info: Info; staff: StaffMember[] }) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [resetting, setResetting] = useState<StaffMember | null>(null)
  const [busy, start] = useTransition()

  const toggle = async (m: StaffMember) => {
    const off = m.status === "active"
    if (off) {
      const ok = await confirmAction({ title: `Turn off ${m.name}'s account?`, body: "They're signed out right away and can't sign in until you turn it back on. Their offers and history stay.", confirm: "Turn off", danger: true })
      if (!ok) return
    }
    start(async () => {
      const r = await setStatus(slug, m.id, off ? "disabled" : "active")
      if (r.error) toast(r.error, "error")
      else toast(off ? `${m.name} is turned off` : `${m.name} can sign in again`)
    })
  }

  const remove = async (m: StaffMember) => {
    const ok = await confirmAction({ title: `Delete ${m.name}'s account?`, body: "The account is gone for good. Someone who sent offers can only be turned off, so their offers keep their name.", confirm: "Delete account", danger: true })
    if (!ok) return
    start(async () => {
      const r = await deleteStaff(slug, m.id)
      if (r.error) toast(r.error, "error")
      else toast(`${m.name}'s account deleted`)
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#17150f] pb-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#17150f]">Staff accounts · {staff.length}</h2>
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
          <UserPlus className="h-4 w-4" /> Add staff
        </button>
      </div>

      <ul className="divide-y divide-[#e6e2db]">
        {staff.map((m) => (
          <li key={m.id} className={`flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between ${m.status === "disabled" ? "opacity-70" : ""}`}>
            <div className="flex min-w-0 items-start gap-4">
              <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center text-base font-bold text-white ${m.full_admin ? "bg-[var(--accent)]" : "bg-[#17150f]"}`}>{initials(m.name)}</span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-[#17150f]">{m.name}</span>
                  {m.is_you && <Tag>You</Tag>}
                  {m.status === "disabled" && <Tag tone="bad">Turned off</Tag>}
                  {m.must_change_password && m.status === "active" && <Tag tone="warn">Chooses a password at sign-in</Tag>}
                </p>
                <p className="truncate text-sm text-[#6b665d]">{[m.email, m.phone].filter(Boolean).join(" · ")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.full_admin ? (
                    <span className="rounded-full inline-flex items-center gap-1 bg-[color-mix(in_srgb,var(--accent)_10%,white)] px-2 py-0.5 text-xs font-bold text-[var(--accent)]">
                      <ShieldCheck className="h-3.5 w-3.5" /> Full admin: everything, including staff accounts
                    </span>
                  ) : (
                    m.sections.map((s) => (
                      <span key={s} className="rounded-xl border border-[#d9d4cb] bg-white px-2 py-0.5 text-xs font-semibold text-[#3d3a34]">
                        {info[s]?.label ?? s}
                      </span>
                    ))
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-[#8a847a]">
                  {m.last_login_at ? `Last signed in ${timeAgo(m.last_login_at)}` : "Hasn't signed in yet"}
                  {m.offers > 0 && ` · ${m.offers} offer${m.offers === 1 ? "" : "s"} sent`}
                </p>
              </div>
            </div>
            {m.is_you ? (
              <p className="text-sm text-[#8a847a] lg:text-right">Change your own details on My account.</p>
            ) : (
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button type="button" onClick={() => setEditing(m)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-sm font-bold text-[#17150f] transition hover:border-[#17150f] disabled:opacity-50">
                  <SlidersHorizontal className="h-4 w-4" /> Access
                </button>
                <button type="button" onClick={() => setResetting(m)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-sm font-bold text-[#17150f] transition hover:border-[#17150f] disabled:opacity-50">
                  <KeyRound className="h-4 w-4" /> Reset password
                </button>
                <button type="button" onClick={() => toggle(m)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-3 py-2 text-sm font-bold text-[#17150f] transition hover:border-[#17150f] disabled:opacity-50">
                  <Power className="h-4 w-4" /> {m.status === "active" ? "Turn off" : "Turn on"}
                </button>
                <button type="button" onClick={() => remove(m)} disabled={busy} aria-label={`Delete ${m.name}'s account`} className="inline-flex items-center px-2.5 py-2 text-[#a39d92] transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <Modal open={adding} onClose={() => setAdding(false)} eyebrow={realty} title="Add a staff account">
        <AddForm slug={slug} realty={realty} loginUrl={loginUrl} sections={sections} info={info} onDone={() => setAdding(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} eyebrow={editing?.name} title="What can they open?">
        {editing && <AccessForm slug={slug} member={editing} sections={sections} info={info} onDone={() => setEditing(null)} />}
      </Modal>
      <Modal open={!!resetting} onClose={() => setResetting(null)} eyebrow={resetting?.name} title="Reset their password">
        {resetting && <ResetForm slug={slug} realty={realty} loginUrl={loginUrl} member={resetting} onDone={() => setResetting(null)} />}
      </Modal>
    </div>
  )
}

/** Full admin, or the sections ticked; Approvals brings Offers along (approving works from the offers). */
function AccessPicker({ value, onChange, sections, info }: { value: Access; onChange: (a: Access) => void; sections: string[]; info: Info }) {
  const tick = (s: string, on: boolean) => {
    let next = on ? [...value.sections, s] : value.sections.filter((x) => x !== s)
    if (on && s === "approvals" && !next.includes("offers")) next = [...next, "offers"]
    if (!on && s === "offers") next = next.filter((x) => x !== "approvals")
    onChange({ access: "sections", sections: sections.filter((x) => next.includes(x)) })
  }
  const option = (on: boolean) => `rounded-xl flex cursor-pointer items-start gap-3 border-2 p-4 transition ${on ? "border-[var(--accent)] bg-white" : "border-[#e0dcd5] bg-white hover:border-[#17150f]"}`

  return (
    <fieldset className="space-y-3">
      <legend className={label}>What can they open?</legend>
      <label className={option(value.access === "full")}>
        <input type="radio" name="access" checked={value.access === "full"} onChange={() => onChange({ access: "full", sections: value.sections })} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
        <span>
          <span className="block font-bold">Full admin</span>
          <span className="block text-sm text-[#5a554d]">Everything, including adding and changing staff accounts.</span>
        </span>
      </label>
      <label className={option(value.access === "sections")}>
        <input type="radio" name="access" checked={value.access === "sections"} onChange={() => onChange({ access: "sections", sections: value.sections.length ? value.sections : ["offers"] })} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
        <span>
          <span className="block font-bold">Only what I choose</span>
          <span className="block text-sm text-[#5a554d]">Everyone sees the Overview and the projects. Tick what else they can use:</span>
        </span>
      </label>
      {value.access === "sections" && (
        <div className="grid gap-2 pl-1 sm:grid-cols-2">
          {sections.map((s) => (
            <label key={s} className="rounded-xl flex cursor-pointer items-start gap-2.5 border border-[#e6e2db] bg-[#faf8f5] p-3 text-sm">
              <input type="checkbox" checked={value.sections.includes(s)} onChange={(e) => tick(s, e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
              <span>
                <span className="block font-bold text-[#17150f]">{info[s]?.label ?? s}</span>
                <span className="block text-xs leading-snug text-[#6b665d]">{info[s]?.text}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}

/** A password box with a suggestion and show/hide. */
function PasswordField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [shown, setShown] = useState(true)
  return (
    <label className="block">
      <span className={label}>Password (at least 8 characters)</span>
      <span className="mt-1.5 flex gap-2">
        <span className="relative block flex-1">
          <input type={shown ? "text" : "password"} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" className={`${box} pr-11 font-mono`} />
          <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#8a847a] hover:text-[#17150f]">
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
        <button type="button" onClick={() => onChange(suggestPassword(10))} title="Suggest a new one" className="rounded-xl inline-flex items-center gap-1.5 border border-[#d9d4cb] bg-white px-3 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
          <RefreshCw className="h-4 w-4" /> New
        </button>
      </span>
      {error && <span className="mt-1.5 block text-sm font-semibold text-red-700">{error}</span>}
    </label>
  )
}

/** After a save: the sign-in details to send the person, ready to copy. */
function Credentials({ realty, loginUrl, name, email, password, mustChange, onDone }: { realty: string; loginUrl: string; name: string; email: string; password: string; mustChange: boolean; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const text = `Hi ${name.split(" ")[0]}, here's your ${realty} dashboard account.\nSign in at: ${loginUrl}\nEmail: ${email}\nPassword: ${password}${mustChange ? "\nYou'll choose your own password when you first sign in." : ""}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      await confirmAction({ title: "Copy this", body: "This browser didn't let the page copy it. Tap the box, select all and copy.", copy: text, confirm: "Done" })
    }
  }
  return (
    <div>
      <p className="text-[15px] text-[#3d3a34]">Send {name.split(" ")[0]} these sign-in details by Viber, text or email. The password isn&apos;t shown again.</p>
      <pre className="rounded-xl mt-4 whitespace-pre-wrap border border-[#e0dcd5] bg-[#faf8f5] p-4 font-mono text-sm text-[#17150f]">{text}</pre>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy sign-in details"}
        </button>
        <button type="button" onClick={onDone} className="rounded-xl border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] hover:border-[#17150f]">
          Done
        </button>
      </div>
    </div>
  )
}

function AddForm({ slug, realty, loginUrl, sections, info, onDone }: { slug: string; realty: string; loginUrl: string; sections: string[]; info: Info; onDone: () => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState(() => suggestPassword(10))
  const [access, setAccessValue] = useState<Access>({ access: "sections", sections: ["offers"] })
  const [mustChange, setMustChange] = useState(true)
  const [result, setResult] = useState<StaffResult | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  if (saved) return <Credentials realty={realty} loginUrl={loginUrl} name={name} email={email.trim().toLowerCase()} password={password} mustChange={mustChange} onDone={onDone} />

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const r = await addStaff(slug, { name, email, phone, password, must_change_password: mustChange, ...access })
          setResult(r)
          if (!r.error && !r.errors) {
            setSaved(true)
            toast(`${name}'s account is ready`)
          }
        })
      }}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={label}>Full name</span>
          <input name="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={input} />
          {result?.errors?.name && <span className="mt-1.5 block text-sm font-semibold text-red-700">{result.errors.name}</span>}
        </label>
        <label className="block">
          <span className={label}>Email (they sign in with it)</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          {result?.errors?.email && <span className="mt-1.5 block text-sm font-semibold text-red-700">{result.errors.email}</span>}
        </label>
        <label className="block">
          <span className={label}>Mobile number (optional)</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 123 4567" className={input} />
          {result?.errors?.phone && <span className="mt-1.5 block text-sm font-semibold text-red-700">{result.errors.phone}</span>}
        </label>
        <div className="sm:col-span-2">
          <PasswordField value={password} onChange={setPassword} error={result?.errors?.password} />
          <label className="mt-3 flex items-start gap-2.5 text-sm text-[#3d3a34]">
            <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
            Ask them to choose their own password when they first sign in
          </label>
        </div>
      </div>
      <AccessPicker value={access} onChange={setAccessValue} sections={sections} info={info} />
      {(result?.errors?.sections || result?.errors?.access) && <p className="text-sm font-semibold text-red-700">{result.errors.sections ?? result.errors.access}</p>}
      {result?.error && <p role="alert" className="text-sm font-bold text-red-700">{result.error}</p>}
      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Create account
      </button>
    </form>
  )
}

function AccessForm({ slug, member, sections, info, onDone }: { slug: string; member: StaffMember; sections: string[]; info: Info; onDone: () => void }) {
  const [access, setAccessValue] = useState<Access>({ access: member.full_admin ? "full" : "sections", sections: member.full_admin ? ["offers"] : member.sections })
  const [error, setError] = useState("")
  const [pending, start] = useTransition()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setError("")
        start(async () => {
          const r = await setAccess(slug, member.id, access)
          if (r.error || r.errors) return setError(r.error ?? Object.values(r.errors ?? {})[0] ?? "Couldn't save.")
          toast(`${member.name}'s access is saved`)
          onDone()
        })
      }}
      className="space-y-5"
    >
      <AccessPicker value={access} onChange={setAccessValue} sections={sections} info={info} />
      <p className="text-sm text-[#5a554d]">The change applies on their next click; they don&apos;t need to sign in again.</p>
      {error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Save access
      </button>
    </form>
  )
}

function ResetForm({ slug, realty, loginUrl, member, onDone }: { slug: string; realty: string; loginUrl: string; member: StaffMember; onDone: () => void }) {
  const [password, setPassword] = useState(() => suggestPassword(10))
  const [mustChange, setMustChange] = useState(true)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  if (saved) return <Credentials realty={realty} loginUrl={loginUrl} name={member.name} email={member.email} password={password} mustChange={mustChange} onDone={onDone} />

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setError("")
        start(async () => {
          const r = await resetPassword(slug, member.id, password, mustChange)
          if (r.error || r.errors) return setError(r.error ?? Object.values(r.errors ?? {})[0] ?? "Couldn't save.")
          toast(`New password set for ${member.name}`)
          setSaved(true)
        })
      }}
      className="space-y-5"
    >
      <p className="text-[15px] text-[#3d3a34]">{member.name} is signed out everywhere and uses this password next time.</p>
      <PasswordField value={password} onChange={setPassword} />
      <label className="flex items-start gap-2.5 text-sm text-[#3d3a34]">
        <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
        Ask them to choose their own password when they sign in
      </label>
      {error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Set new password
      </button>
    </form>
  )
}
