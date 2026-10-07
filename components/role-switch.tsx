"use client"

import { useState, useTransition } from "react"
import { ArrowLeft, Eye, LoaderCircle } from "lucide-react"
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
          <option value="admin">Super admin</option>
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

/** The strip across a realty dashboard while a super admin previews it. */
export function PreviewBar({ slug, realtyName, role, realties }: { slug: string; realtyName: string; role: "realty" | "agent"; realties: ViewRealty[] }) {
  const [pending, start] = useTransition()
  return (
    <div className="mb-8 border-l-4 border-amber-300 bg-[#17150f] text-white">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
            <Eye className="h-4 w-4" /> Super admin preview
          </p>
          <p className="mt-0.5 text-sm text-white/85">
            You&apos;re seeing <span className="font-bold text-white">{realtyName}</span> as {role === "realty" ? "its" : "an"} <span className="font-bold text-white">{role === "realty" ? "Admin" : "Agent"}</span>. Anything you do here is real.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
          <RoleSwitch from="realty" current={`${slug}:${role}`} realties={realties} className="min-w-0 sm:w-72" />
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => void (await switchView("realty", { role: "admin" })))}
            className="inline-flex items-center justify-center gap-1.5 bg-white px-4 py-2.5 text-sm font-bold text-[#17150f] transition hover:bg-amber-300 disabled:opacity-60"
          >
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />} Back to super admin
          </button>
        </div>
      </div>
    </div>
  )
}
