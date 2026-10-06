"use client"

import { useActionState } from "react"
import { LoaderCircle } from "lucide-react"
import { Alert, Label, fieldClass } from "@/components/form"
import { type RegisterState, registerRealty } from "./actions"

export function RegisterForm({ token, realtyName, email }: { token: string; realtyName: string; email: string }) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerRealty.bind(null, token), {})
  // After an error the browser form is reset, so the last typed values come back from the action.
  const v = state.values

  return (
    <form action={action} className="space-y-8">
      <fieldset className="space-y-5">
        <legend className="text-base font-semibold">Your company</legend>
        <label className="block">
          <Label>Company name</Label>
          <input name="name" required defaultValue={v?.name ?? realtyName} className={fieldClass} />
        </label>
        <label className="block">
          <Label>Logo (PNG or JPG, up to 4 MB)</Label>
          <input name="logo" type="file" accept="image/*" className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700" />
        </label>
        <label className="block">
          <Label>Brand colour</Label>
          <span className="mt-1.5 flex items-center gap-3">
            <input name="accent_color" type="color" defaultValue="#1f2937" className="h-10 w-14 cursor-pointer rounded-md border border-slate-300 bg-white p-1" />
            <span className="text-xs text-slate-500">Used on your dashboard and login page. Pick the colour from your logo.</span>
          </span>
        </label>
        <label className="block">
          <Label>Office address</Label>
          <input name="address" defaultValue={v?.address} placeholder="Street, city, province" className={fieldClass} />
        </label>
        <label className="block">
          <Label>About the company (optional)</Label>
          <textarea name="about" rows={4} maxLength={2000} defaultValue={v?.about} placeholder="A few sentences buyers should know." className={fieldClass} />
        </label>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-base font-semibold">Your login</legend>
        <p className="-mt-3 text-sm text-slate-500">This is the account that manages your realty on jvconline. You can invite agents from it.</p>
        <label className="block">
          <Label>Your name</Label>
          <input name="contact_name" required defaultValue={v?.contact_name} autoComplete="name" className={fieldClass} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label>Email</Label>
            <input name="email" type="email" required defaultValue={v?.email ?? email} autoComplete="username" className={fieldClass} />
          </label>
          <label className="block">
            <Label>Phone</Label>
            <input name="phone" type="tel" defaultValue={v?.phone} autoComplete="tel" placeholder="+63 …" className={fieldClass} />
          </label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label>Password</Label>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
          </label>
          <label className="block">
            <Label>Repeat password</Label>
            <input name="password_confirmation" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
          </label>
        </div>
        <p className="text-xs text-slate-500">At least 8 characters.</p>
      </fieldset>

      {state.error && <Alert kind="error">{state.error}</Alert>}

      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 sm:w-auto sm:px-8">
        {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
        Create my realty account
      </button>
    </form>
  )
}
