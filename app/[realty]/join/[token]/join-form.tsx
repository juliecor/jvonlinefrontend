"use client"

import { useActionState } from "react"
import { LoaderCircle } from "lucide-react"
import { Alert, Label, fieldClass } from "@/components/form"
import { type JoinState, joinRealty } from "./actions"

export function JoinForm({ token, name, email }: { token: string; name: string; email: string | null }) {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinRealty.bind(null, token), {})
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <Label>Your name</Label>
        <input name="name" required defaultValue={state.name ?? name} autoComplete="name" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Email (your login)</Label>
        <input name="email" type="email" required defaultValue={state.email ?? email ?? ""} autoComplete="username" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Password</Label>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
      </label>
      <label className="block">
        <Label>Repeat password</Label>
        <input name="password_confirmation" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
      </label>
      <p className="text-xs text-slate-500">At least 8 characters.</p>
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
        {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
        Create my account
      </button>
    </form>
  )
}
