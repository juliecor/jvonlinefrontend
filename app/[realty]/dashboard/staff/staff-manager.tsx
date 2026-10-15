"use client"

import Link from "next/link"
import { useOptimistic, useState, useTransition } from "react"
import {
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ClipboardCheck,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Handshake,
  KeyRound,
  ListChecks,
  LoaderCircle,
  Mail,
  Phone,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { Tag, display } from "@/components/dashboard-ui"
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
  photo: string | null
  full_admin: boolean
  sections: string[]
  status: "active" | "disabled"
  must_change_password: boolean
  last_login_at: string | null
  offers: number
  is_you: boolean
}

type Info = Record<string, { label: string; text: string }>

/** Each section's icon, the same as in the menu. */
const ICON: Record<string, typeof FileText> = { offers: FileText, approvals: BadgeCheck, projects: Building2, agents: Users, realties: Handshake, requirements: ClipboardCheck, ai: Sparkles, tasks: ListChecks }

const box = "block w-full rounded-xl border border-[#d9d4cb] bg-white px-3.5 py-3 text-[15px] text-[#17150f] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const input = `mt-1.5 ${box}`
const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#6b665d]"
const action = "inline-flex items-center gap-1.5 rounded-xl border border-[#d9d4cb] bg-white px-2.5 py-2 text-sm sm:px-3 font-bold text-[#17150f] transition hover:border-[#17150f] disabled:opacity-50"
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
const firstName = (name: string) => name.split(" ")[0]

/**
 * Team > Staff: everyone with a staff account as a card (photo, contact, when
 * they last signed in) with what they can open as tiles the admin clicks on
 * or off, saved right away. Add, reset password, turn off and delete too.
 * Your own card is read-only: that's My account.
 */
export function StaffManager({ slug, realty, loginUrl, sections, info, staff }: { slug: string; realty: string; loginUrl: string; sections: string[]; info: Info; staff: StaffMember[] }) {
  const [adding, setAdding] = useState(false)
  const [resetting, setResetting] = useState<StaffMember | null>(null)
  const admins = staff.filter((m) => m.full_admin).length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`${display} flex items-center gap-3 text-[21px] tracking-tight text-[#17150f] before:h-6 before:w-1 before:rounded-full before:bg-[var(--accent)]`}>
            Staff accounts <span className="text-[#a39d92]">{staff.length}</span>
          </h2>
          <p className="mt-1 pl-4 text-sm text-[#6b665d]">
            {admins} full admin{admins === 1 ? "" : "s"} · {staff.length - admins} with chosen sections. Click a person to see and change what they can open.
          </p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
          <UserPlus className="h-4 w-4" /> Add staff
        </button>
      </div>

      <ul className="mt-5 space-y-3">
        {staff.map((m) => (
          <StaffCard key={m.id} slug={slug} member={m} sections={sections} info={info} onReset={() => setResetting(m)} />
        ))}
      </ul>

      <Modal open={adding} onClose={() => setAdding(false)} eyebrow={realty} title="Add a staff account">
        <AddForm slug={slug} realty={realty} loginUrl={loginUrl} sections={sections} info={info} onDone={() => setAdding(false)} />
      </Modal>
      <Modal open={!!resetting} onClose={() => setResetting(null)} eyebrow={resetting?.name} title="Reset their password">
        {resetting && <ResetForm slug={slug} realty={realty} loginUrl={loginUrl} member={resetting} onDone={() => setResetting(null)} />}
      </Modal>
    </div>
  )
}

/** One person: who they are and, opened, what they can open (click to change) and the account's tools. */
function StaffCard({ slug, member: m, sections, info, onReset }: { slug: string; member: StaffMember; sections: string[]; info: Info; onReset: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, start] = useTransition()
  // The tiles change at the click; the saved access comes back with the page.
  const [shown, show] = useOptimistic<Access>({ access: m.full_admin ? "full" : "sections", sections: m.sections })
  const full = shown.access === "full"
  const off = m.status === "disabled"
  const locked = m.is_you || busy
  const name = firstName(m.name)

  const save = (next: Access, done: string) =>
    start(async () => {
      show(next)
      const r = await setAccess(slug, m.id, next)
      if (r.error || r.errors) toast(r.error ?? Object.values(r.errors ?? {})[0] ?? "Couldn't save.", "error")
      else toast(done)
    })

  const tick = (s: string) => {
    if (locked || full) return
    const on = shown.sections.includes(s)
    let next = on ? shown.sections.filter((x) => x !== s) : [...shown.sections, s]
    // Approving works from the offers, so Approvals brings Offers and Offers takes Approvals along.
    if (!on && s === "approvals" && !next.includes("offers")) next = [...next, "offers"]
    if (on && s === "offers") next = next.filter((x) => x !== "approvals")
    if (!next.length) return toast(`Leave ${name} at least one section, or turn the account off.`, "error")
    save({ access: "sections", sections: sections.filter((x) => next.includes(x)) }, on ? `${name} can't open ${info[s]?.label ?? s} now` : `${name} can open ${info[s]?.label ?? s} now`)
  }

  const fullAdmin = async () => {
    if (locked) return
    if (full) return save({ access: "sections", sections }, `${name} isn't a full admin now. Untick what they shouldn't open.`)
    const ok = await confirmAction({ title: `Make ${name} a full admin?`, body: "They can open everything, including Staff accounts: adding people, changing what they can open and resetting passwords.", confirm: "Make full admin" })
    if (ok) save({ access: "full", sections: shown.sections }, `${name} is a full admin now`)
  }

  const toggle = async () => {
    if (!off) {
      const ok = await confirmAction({ title: `Turn off ${m.name}'s account?`, body: "They're signed out right away and can't sign in until you turn it back on. Their offers and history stay.", confirm: "Turn off", danger: true })
      if (!ok) return
    }
    start(async () => {
      const r = await setStatus(slug, m.id, off ? "active" : "disabled")
      if (r.error) toast(r.error, "error")
      else toast(off ? `${m.name} can sign in again` : `${m.name} is turned off`)
    })
  }

  const remove = async () => {
    const ok = await confirmAction({ title: `Delete ${m.name}'s account?`, body: "The account is gone for good. Someone who sent offers can only be turned off, so their offers keep their name.", confirm: "Delete account", danger: true })
    if (!ok) return
    start(async () => {
      const r = await deleteStaff(slug, m.id)
      if (r.error) toast(r.error, "error")
      else toast(`${m.name}'s account deleted`)
    })
  }

  const count = full ? sections.length : shown.sections.length

  return (
    <li className={`overflow-hidden rounded-2xl border border-[#e8eaed] bg-white shadow-[0_2px_12px_-2px_rgba(23,21,15,0.06)] ${off ? "opacity-75" : ""}`}>
      {/* Who they are, and what they can open at a glance; a click opens the rest */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="relative flex w-full flex-wrap items-center gap-x-4 gap-y-3 p-4 pr-12 text-left outline-none transition hover:bg-[#fbfaf8] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] sm:flex-nowrap sm:p-6"
      >
        <span className="relative shrink-0">
          {m.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-4 ring-[#f3f1ed] sm:h-16 sm:w-16" />
          ) : (
            <span aria-hidden className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold sm:h-16 sm:w-16 sm:text-lg text-white ring-4 ring-[#f3f1ed] ${full ? "bg-[var(--accent)]" : "bg-[#17150f]"}`}>
              {initials(m.name)}
            </span>
          )}
          <span title={off ? "Turned off" : "Active"} className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-[3px] border-white ${off ? "bg-[#a39d92]" : "bg-emerald-500"}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className={`${display} text-[20px] leading-tight tracking-tight text-[#17150f]`}>{m.name}</span>
            {m.is_you && <Tag>You</Tag>}
            {off && <Tag tone="bad">Turned off</Tag>}
            {m.must_change_password && !off && <Tag tone="warn">Chooses a password at sign-in</Tag>}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-[#6b665d]">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{m.email}</span>
            </span>
            {m.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {m.phone}
              </span>
            )}
          </p>
          <p className="mt-1.5 text-xs font-medium text-[#8a847a]">
            {m.last_login_at ? `Last signed in ${timeAgo(m.last_login_at)}` : "Hasn't signed in yet"}
            {m.offers > 0 && ` · ${m.offers} offer${m.offers === 1 ? "" : "s"} sent`}
          </p>
        </div>
        <span className="flex w-full shrink-0 flex-col items-start gap-2 pl-16 sm:w-auto sm:items-end sm:pl-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${full ? "bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]" : "bg-[#f3f1ed] text-[#3d3a34]"}`}>
            {full ? <ShieldCheck className="h-4 w-4" /> : <KeyRound className="h-3.5 w-3.5" />}
            {full ? "Full admin" : `Staff · ${count} of ${sections.length} sections`}
          </span>
          <span
            className="flex flex-wrap gap-1"
            aria-label={`Can open: ${sections
              .filter((x) => full || shown.sections.includes(x))
              .map((x) => info[x]?.label ?? x)
              .join(", ")}`}
          >
            {sections.map((x) => {
              const Icon = ICON[x] ?? FileText
              const can = full || shown.sections.includes(x)
              return (
                <span
                  key={x}
                  title={`${info[x]?.label ?? x}${can ? "" : ": not allowed"}`}
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${can ? "bg-[color-mix(in_srgb,var(--accent)_12%,white)] text-[var(--accent)]" : "bg-[#f3f1ed] text-[#c9c4bb]"}`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
              )
            })}
          </span>
        </span>
        <ChevronDown aria-hidden className={`absolute right-4 top-4 h-5 w-5 shrink-0 text-[#8a847a] transition sm:static ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* What they can open */}
          <div className="border-t border-[#f0eeea] bg-[#fbfaf8] px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b665d]">What {m.is_you ? "you" : name} can open</p>
              <button type="button" role="switch" aria-checked={full} onClick={fullAdmin} disabled={locked} className="group inline-flex items-center gap-2.5 text-sm font-bold text-[#17150f] disabled:cursor-default">
                <ShieldCheck className={`h-4 w-4 ${full ? "text-[var(--accent)]" : "text-[#a39d92]"}`} />
                Full admin
                <span className={`relative h-6 w-11 rounded-full transition ${full ? "bg-[var(--accent)]" : "bg-[#d9d4cb] group-enabled:group-hover:bg-[#c9c4bb]"} ${locked ? "opacity-60" : ""}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${full ? "left-[22px]" : "left-0.5"}`} />
                </span>
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
              {sections.map((s) => {
                const on = full || shown.sections.includes(s)
                const Icon = ICON[s] ?? FileText
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => tick(s)}
                    disabled={locked || full}
                    title={info[s]?.text}
                    className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left sm:gap-3 sm:p-2.5 transition disabled:cursor-default ${
                      on ? "border-[color-mix(in_srgb,var(--accent)_30%,white)] bg-white shadow-[0_1px_3px_rgba(23,21,15,0.06)]" : "border-dashed border-[#d9d4cb] bg-transparent"
                    } ${locked || full ? "" : on ? "hover:border-[var(--accent)]" : "hover:border-[#17150f] hover:bg-white"}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${on ? "bg-[var(--accent)] text-white" : "bg-[#efece7] text-[#a39d92]"}`}>
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    </span>
                    <span className={`min-w-0 flex-1 text-[13px] font-bold leading-tight sm:text-sm ${on ? "text-[#17150f]" : "text-[#8a847a]"}`}>{info[s]?.label ?? s}</span>
                    <span className={`hidden h-5 w-5 shrink-0 items-center justify-center rounded-full min-[400px]:flex ${on ? "bg-emerald-500 text-white" : "border-2 border-[#d9d4cb]"}`}>
                      {on && <Check className="h-3 w-3" strokeWidth={3.5} />}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-[#8a847a]">
              {m.is_you
                ? "Your own access is changed by another full admin."
                : full
                  ? `A full admin opens everything here, plus Staff accounts. Turn off Full admin to choose.`
                  : `Everyone sees the statistics and the projects. Changes apply on ${name}'s next click.`}
            </p>
          </div>

          {/* The account */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#f0eeea] px-5 py-3 sm:px-6">
            {m.is_you ? (
              <p className="mr-auto text-sm text-[#6b665d]">
                Change your photo, name and password on{" "}
                <Link href={`/${slug}/dashboard/account`} className="font-bold text-[var(--accent)] hover:underline">
                  My account
                </Link>
                .
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  aria-label={`Delete ${m.name}'s account`}
                  className="mr-auto inline-flex items-center rounded-xl px-2.5 py-2 text-[#a39d92] transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {busy && <LoaderCircle className="h-4 w-4 animate-spin text-[#8a847a]" />}
                <button type="button" onClick={onReset} disabled={busy} className={action}>
                  <KeyRound className="h-4 w-4" /> Reset password
                </button>
                <button type="button" onClick={toggle} disabled={busy} className={action}>
                  <Power className="h-4 w-4" /> {off ? "Turn on" : "Turn off"}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </li>
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
      {error && (
        <p role="alert" className="text-sm font-bold text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Set new password
      </button>
    </form>
  )
}
