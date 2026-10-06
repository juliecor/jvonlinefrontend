"use client"

import { useActionState } from "react"
import { LoaderCircle, LogIn } from "lucide-react"
import { type LoginState, signInAdmin } from "./actions"

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signInAdmin, {})
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Sign in
      </button>
    </form>
  )
}
