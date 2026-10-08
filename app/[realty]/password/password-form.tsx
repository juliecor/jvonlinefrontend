"use client"

import { useActionState, useState } from "react"
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, LoaderCircle } from "lucide-react"
import { type PasswordState, changePassword } from "./actions"

const field = "block w-full border bg-white px-4 py-3.5 text-[15px] text-[#17150f] outline-none transition placeholder:text-[#b3ada3] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]"

/** The temporary password, then a new one twice; a short checklist shows what is still missing. */
export function PasswordForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword.bind(null, slug), {})
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)

  const rules = [
    { ok: next.length >= 8, text: "At least 8 characters" },
    { ok: next.length > 0 && next === confirm, text: "Both new passwords match" },
    { ok: next.length > 0 && next !== current, text: "Different from the temporary password" },
  ]
  const errors = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className={label}>Temporary password</span>
        <input
          name="current_password"
          type={show ? "text" : "password"}
          required
          autoFocus
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          aria-invalid={!!errors.current_password}
          className={`${field} mt-1.5 ${errors.current_password ? "border-red-500" : "border-[#d9d4cb]"}`}
        />
        {errors.current_password && <span className="mt-1.5 block text-sm font-semibold text-red-700">{errors.current_password}</span>}
      </label>

      <label className="block">
        <span className={label}>New password</span>
        <span className="relative mt-1.5 block">
          <input
            name="password"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            aria-invalid={!!errors.password}
            className={`${field} pr-12 ${errors.password ? "border-red-500" : "border-[#d9d4cb]"}`}
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide passwords" : "Show passwords"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8a847a] transition hover:text-[#17150f]">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </span>
        {errors.password && <span className="mt-1.5 block text-sm font-semibold text-red-700">{errors.password}</span>}
      </label>

      <label className="block">
        <span className={label}>Repeat new password</span>
        <input name="password_confirmation" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${field} mt-1.5 border-[#d9d4cb]`} />
      </label>

      <ul className="space-y-1.5 border-l-4 border-[#e6e2db] bg-[#faf8f5] px-4 py-3 text-sm">
        {rules.map((r) => (
          <li key={r.text} className={`flex items-center gap-2 ${r.ok ? "font-semibold text-emerald-800" : "text-[#6b665d]"}`}>
            <span aria-hidden className={`flex h-4 w-4 items-center justify-center rounded-full ${r.ok ? "bg-emerald-600 text-white" : "border border-[#c9c3b8]"}`}>{r.ok && <Check className="h-3 w-3" strokeWidth={3.5} />}</span>
            {r.text}
          </li>
        ))}
      </ul>

      {state.error && (
        <p role="alert" className="flex gap-3 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-[15px] font-semibold text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] px-6 py-4 text-base font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {pending && <LoaderCircle className="h-5 w-5 animate-spin" />}
        Save and open my dashboard {!pending && <ArrowRight className="h-5 w-5" />}
      </button>
    </form>
  )
}
