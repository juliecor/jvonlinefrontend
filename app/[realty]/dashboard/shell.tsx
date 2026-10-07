"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, Building2, ClipboardCheck, FileText, Globe, LayoutDashboard, LogOut, Menu, Plus, Users, X } from "lucide-react"
import { RealtyMark } from "@/components/form"
import { SITE_REALTY } from "@/lib/public-projects-types"
import type { RealtyUser } from "@/lib/realty-auth"

export type ShellCounts = { projects: number; offers: number; agents: number; agentsInvited: number; publicProjects: number; newResponses: number }

type Item = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; count?: number; note?: string; alert?: string }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

/** A light tint of the realty's colour, for the active row and the hover. */
const tint = (pct: number) => `color-mix(in srgb, var(--accent) ${pct}%, white)`

/**
 * The realty dashboard's frame: a light sidebar on desktop (a drawer on the phone)
 * with the realty's logo, its brand colour as the accent, counts beside each
 * section, a "New offer" shortcut and the account at the foot.
 */
export function DashboardShell({ slug, user, counts, signOutAction, children }: { slug: string; user: RealtyUser; counts: ShellCounts | null; signOutAction: () => Promise<void>; children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const realty = user.realty
  const staff = user.role === "realty"
  const isSite = slug === SITE_REALTY

  const groups: { title: string; items: Item[] }[] = [
    { title: "Workspace", items: [{ href: `/${slug}/dashboard`, label: "Overview", icon: LayoutDashboard, exact: true }] },
    {
      title: "Sales",
      items: [
        { href: `/${slug}/dashboard/projects`, label: "Projects", icon: Building2, count: counts?.projects },
        { href: `/${slug}/dashboard/offers`, label: staff ? "Offers" : "My offers", icon: FileText, count: counts?.offers, alert: counts?.newResponses ? `${counts.newResponses} new` : undefined },
      ],
    },
    ...(staff
      ? [
          { title: "Team", items: [{ href: `/${slug}/dashboard/agents`, label: "Agents", icon: Users, count: counts?.agents, note: counts?.agentsInvited ? `+${counts.agentsInvited} invited` : undefined }] },
          { title: "Setup", items: [{ href: `/${slug}/dashboard/requirements`, label: "Buyer requirements", icon: ClipboardCheck }] },
        ]
      : []),
  ]

  const panel = (
    <div className="flex h-full flex-col border-r border-[#e6e2db] bg-white text-[#17150f]">
      <div className="h-1 shrink-0 bg-[var(--accent)]" />

      {/* Brand */}
      <div className="border-b border-[#efebe5] px-6 pb-5 pt-6">
        <Link href={`/${slug}/dashboard`} onClick={() => setOpen(false)} className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          <RealtyMark name={realty.name} logo={realty.logo_url} className="h-14" />
        </Link>
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-[#6b665d]">Dashboard</p>
          <span className="shrink-0 bg-[#f3f0eb] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#3d3a34]">{staff ? "Admin" : "Agent"}</span>
        </div>
      </div>

      {/* Primary action */}
      <div className="px-5 pt-5">
        <Link
          href={`/${slug}/dashboard/offers/new`}
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-3.5 text-[15px] font-bold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} /> New offer
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-6 text-xs font-bold uppercase tracking-[0.16em] text-[#8a847a]">{g.title}</p>
            <ul className="mt-2 space-y-0.5 px-3">
              {g.items.map(({ href, label, icon: Icon, exact, count, note, alert }) => {
                const active = exact ? path === href : path.startsWith(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      style={active ? { backgroundColor: tint(10) } : undefined}
                      className={`group relative flex items-center gap-3 px-3 py-3 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${active ? "font-bold text-[#17150f]" : "font-semibold text-[#3d3a34] hover:bg-[#f6f4f0] hover:text-[#17150f]"}`}
                    >
                      <span aria-hidden className={`absolute inset-y-1.5 left-0 w-1 bg-[var(--accent)] transition-opacity ${active ? "opacity-100" : "opacity-0"}`} />
                      <Icon className={`h-5 w-5 shrink-0 ${active ? "text-[var(--accent)]" : "text-[#8a847a] group-hover:text-[#3d3a34]"}`} strokeWidth={active ? 2.25 : 2} />
                      <span className="min-w-0 flex-1 truncate">
                        {label}
                        {note && <span className="ml-2 text-xs font-semibold text-[#8a847a]">{note}</span>}
                        {alert && <span className="ml-2 bg-[var(--accent)] px-1.5 py-0.5 align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-white">{alert}</span>}
                      </span>
                      {count !== undefined && (
                        <span className={`min-w-[2rem] px-2 py-0.5 text-center text-sm font-bold tabular-nums ${active ? "bg-[var(--accent)] text-white" : "bg-[#f1eee9] text-[#3d3a34]"}`}>{count}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Public site */}
      <div className="px-5 pb-5">
        <a
          href={isSite ? "/" : `/${slug}/login`}
          target="_blank"
          rel="noreferrer"
          className="group block border border-[#e6e2db] bg-[#faf8f5] p-4 outline-none transition hover:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6b665d]">
              <Globe className="h-4 w-4 text-[var(--accent)]" /> {isSite ? "Public site" : "Sign-in page"}
            </p>
            <ArrowUpRight className="h-4 w-4 text-[#8a847a] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
          </div>
          <p className="mt-2 truncate text-[15px] font-bold text-[#17150f]">{isSite ? "jvconline.ph" : `jvconline.ph/${slug}/login`}</p>
          <p className="mt-0.5 text-sm text-[#6b665d]">
            {isSite ? (counts ? `${counts.publicProjects} project page${counts.publicProjects === 1 ? "" : "s"} live` : "Johndorf's website") : staff ? "Share it with your agents" : "Where you sign in"}
          </p>
        </a>
      </div>

      {/* Account */}
      <div className="flex items-center gap-3 border-t border-[#e6e2db] px-5 py-4">
        <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--accent)] text-[15px] font-bold text-white">{initials(user.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-[#17150f]">{user.name}</p>
          <p className="truncate text-sm text-[#6b665d]">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" title="Sign out" aria-label="Sign out" className="flex h-10 w-10 items-center justify-center text-[#6b665d] outline-none transition hover:bg-[#f6f4f0] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f6f4f0] text-[#17150f] lg:grid lg:grid-cols-[288px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">{panel}</aside>

      {/* Phone top bar */}
      <div className="sticky top-0 z-40 border-b border-[#e6e2db] bg-white lg:hidden">
        <div className="h-1 bg-[var(--accent)]" />
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={`/${slug}/dashboard`}>
            <RealtyMark name={realty.name} logo={realty.logo_url} className="h-9" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/${slug}/dashboard/offers/new`} className="flex items-center gap-1.5 bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Offer
            </Link>
            <button type="button" onClick={() => setOpen(true)} aria-label={counts?.newResponses ? `Open menu, ${counts.newResponses} new buyer updates` : "Open menu"} className="relative p-2 text-[#17150f]">
              <Menu className="h-6 w-6" />
              {!!counts?.newResponses && <span aria-hidden className="absolute right-1 top-1 h-2.5 w-2.5 border-2 border-white bg-[var(--accent)]" />}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#17150f]/40" />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] shadow-2xl">
            {panel}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-5 p-2 text-[#6b665d] hover:text-[#17150f]">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0 px-5 py-8 sm:px-10 sm:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
        <p className="mt-16 text-center text-xs text-[#a39d92]">
          Powered by <Link href="/platform" className="font-medium text-[#8a847a] hover:text-[#17150f]">jvconline</Link>
        </p>
      </main>
    </div>
  )
}
