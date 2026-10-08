"use client"

import { useActionState, useState } from "react"
import { AlertCircle, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react"
import { type UnlockState, unlockOffer } from "./actions"

const field = "mt-1.5 block w-full border border-[#d9d4cb] bg-white px-4 py-3.5 text-[15px] text-[#17150f] outline-none transition placeholder:text-[#b3ada3] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
const label = "text-xs font-bold uppercase tracking-[0.12em] text-[#5a554d]"

/** The buyer's sign-in for a private offer: the username stays filled in after a wrong try. */
export function UnlockForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState<UnlockState, FormData>(unlockOffer.bind(null, code), {})
  const [show, setShow] = useState(false)

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className={label}>Username</span>
        <input name="username" required autoFocus defaultValue={state.username ?? ""} autoComplete="username" autoCapitalize="none" spellCheck={false} className={field} />
      </label>
      <label className="block">
        <span className={label}>Password</span>
        <span className="relative mt-1.5 block">
          <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" autoCapitalize="none" spellCheck={false} className={`${field} mt-0 pr-12`} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8a847a] transition hover:text-[#17150f]">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </span>
      </label>
      {state.error && (
        <p role="alert" className="flex gap-3 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-[15px] font-semibold text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] px-6 py-4 text-base font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {pending && <LoaderCircle className="h-5 w-5 animate-spin" />}
        Open my offer {!pending && <ArrowRight className="h-5 w-5" />}
      </button>
    </form>
  )
}
