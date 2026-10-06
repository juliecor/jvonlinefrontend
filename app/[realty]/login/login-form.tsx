"use client"

import { useActionState } from "react"
import { LoaderCircle, LogIn } from "lucide-react"
import { Alert, Label, fieldClass } from "@/components/form"
import { type RealtyLoginState, signInRealty } from "./actions"

export function RealtyLoginForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<RealtyLoginState, FormData>(signInRealty.bind(null, slug), {})
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <Label>Email</Label>
        <input name="email" type="email" required autoComplete="username" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Password</Label>
        <input name="password" type="password" required autoComplete="current-password" className={fieldClass} />
      </label>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Sign in
      </button>
    </form>
  )
}
