"use client"

import { useState, useTransition } from "react"
import { LoaderCircle } from "lucide-react"
import { type ViewTarget, switchView } from "@/app/view-as/actions"

export type ViewRealty = { slug: string; name: string }

const ROLES = [
  ["realty", "Admin"],
  ["agent", "Agent"],
] as const

const decode = (v: string): ViewTarget => {
  if (v === "admin") return { role: "admin" }
  const [realty, role] = v.split(":")
  return { realty, role: role as "realty" | "agent" }
}

/** "Switch role" for super admins: the platform, or any realty's dashboard as its admin or an agent. */
export function RoleSwitch({ from, current, realties, tone = "dark", className = "" }: { from: "admin" | "realty"; current: string; realties: ViewRealty[]; tone?: "dark" | "light"; className?: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState("")
  const go = (target: ViewTarget) =>
    start(async () => {
      setError("")
      const r = await switchView(from, target)
      if (r?.error) setError(r.error)
    })

  return (
    <div className={className}>
      <div className="relative">
        <select
          value={current}
          disabled={pending}
          onChange={(e) => go(decode(e.target.value))}
          aria-label="Switch role"
          className={`block w-full border py-2.5 pl-3 pr-9 text-sm font-bold outline-none disabled:opacity-60 [&_optgroup]:text-[#17150f] [&_option]:text-[#17150f] ${tone === "dark" ? "border-white/25 bg-white/10 text-white focus:border-white" : "border-[#d9d4cb] bg-white text-[#17150f] focus:border-[var(--accent)]"}`}
        >
          <option value="admin">jvconline admin (all realties)</option>
          {realties.map((r) => (
            <optgroup key={r.slug} label={r.name}>
              {ROLES.map(([role, label]) => (
                <option key={role} value={`${r.slug}:${role}`}>
                  {label} · {r.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {pending && <LoaderCircle className={`pointer-events-none absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin ${tone === "dark" ? "text-white" : "text-[#17150f]"}`} />}
      </div>
      {error && <p className={`mt-1.5 text-xs font-semibold ${tone === "dark" ? "text-red-300" : "text-red-700"}`}>{error}</p>}
    </div>
  )
}
