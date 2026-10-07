"use client"

import { useActionState, useState } from "react"
import { ArrowRight, Check, Eye, EyeOff, FileText, LoaderCircle } from "lucide-react"
import { fileSize } from "@/lib/requirements-types"
import { type JoinState, joinRealty } from "./actions"

const field = "mt-1.5 block w-full border border-[#d9d4cb] bg-white px-4 py-3.5 text-[15px] text-[#17150f] outline-none transition placeholder:text-[#b3ada3] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]"

/** Name, login email, contact number, resume and password, with the password rules ticked off as they type. */
export function JoinForm({ token, name, email }: { token: string; name: string; email: string | null }) {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinRealty.bind(null, token), {})
  const [show, setShow] = useState(false)
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [phone, setPhone] = useState(state.phone ?? "")
  const [resume, setResume] = useState<File | null>(null)
  // The form action clears the file input after each try, so forget the picked file with it.
  const [seen, setSeen] = useState(state)
  if (seen !== state) {
    setSeen(state)
    setResume(null)
  }
  const rules = [
    { ok: pw.length >= 8, text: "At least 8 characters" },
    { ok: pw.length > 0 && pw === pw2, text: "Both passwords match" },
  ]
  const phoneRules = [
    { ok: phone.startsWith("09"), text: "Starts with 09" },
    { ok: phone.length === 11, text: "11 digits" },
  ]

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className={label}>Your full name</span>
        <input name="name" required defaultValue={state.name ?? name} autoComplete="name" className={field} />
        <span className="mt-1 block text-xs text-[#8a847a]">Buyers see this on the offers you send.</span>
      </label>
      <label className="block">
        <span className={label}>Email</span>
        <input name="email" type="email" required defaultValue={state.email ?? email ?? ""} autoComplete="username" placeholder="you@example.com" className={field} />
        <span className="mt-1 block text-xs text-[#8a847a]">You&apos;ll sign in with this.</span>
      </label>
      <label className="block">
        <span className={label}>Contact number</span>
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          required
          maxLength={11}
          pattern="09[0-9]{9}"
          title="11-digit mobile number starting with 09, like 09171234567"
          autoComplete="tel-national"
          placeholder="09171234567"
          value={phone}
          // Numbers only: anything else (spaces, dashes, +63) is dropped as they type or paste.
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          className={field}
        />
        <span className="mt-1 block text-xs text-[#8a847a]">Your Philippine mobile number, so the team can reach you.</span>
        <Checklist rules={phoneRules} className="mt-2" />
      </label>
      <div>
        <span className={label}>Resume</span>
        <label className="mt-1.5 flex cursor-pointer items-center gap-3 border border-dashed border-[#cfc9bf] bg-white px-4 py-3.5 transition hover:border-[var(--accent)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/15">
          <FileText className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-[#17150f]">{resume ? resume.name : "Choose your resume"}</span>
            <span className="block text-xs text-[#8a847a]">{resume ? `${fileSize(resume.size)} · tap to change` : "PDF only, up to 10 MB"}</span>
          </span>
          <input
            name="resume"
            type="file"
            accept="application/pdf,.pdf"
            required
            onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
        </label>
        <span className="mt-1 block text-xs text-[#8a847a]">The team reviews it before your account opens.</span>
      </div>
      <label className="block">
        <span className={label}>Password</span>
        <span className="relative mt-1.5 block">
          <input
            name="password"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className={`${field} mt-0 pr-12`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8a847a] hover:text-[#17150f]"
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </span>
      </label>
      <label className="block">
        <span className={label}>Repeat password</span>
        <input
          name="password_confirmation"
          type={show ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className={field}
        />
      </label>
      <Checklist rules={rules} />
      {state.error && (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] px-5 py-4 text-base font-bold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
        Send application
        {!pending && <ArrowRight className="h-5 w-5" />}
      </button>
    </form>
  )
}

/** Rules that tick green as they're met (contact number, password). */
function Checklist({ rules, className = "" }: { rules: { ok: boolean; text: string }[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-1.5 ${className}`}>
      {rules.map((r) => (
        <li key={r.text} className={`flex items-center gap-1.5 text-sm font-semibold transition ${r.ok ? "text-emerald-700" : "text-[#a39d92]"}`}>
          <span className={`flex h-4 w-4 items-center justify-center ${r.ok ? "bg-emerald-600 text-white" : "border border-[#cfc9bf]"}`}>{r.ok && <Check className="h-3 w-3" strokeWidth={3} />}</span>
          {r.text}
        </li>
      ))}
    </ul>
  )
}
