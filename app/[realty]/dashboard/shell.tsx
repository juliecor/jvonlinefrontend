"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, Building2, FileText, Globe, LayoutDashboard, LogOut, Menu, Plus, Users, X } from "lucide-react"
import { RealtyMark } from "@/components/form"
import { SITE_REALTY } from "@/lib/public-projects-types"
import type { RealtyUser } from "@/lib/realty-auth"

export type ShellCounts = { projects: number; offers: number; agents: number; agentsInvited: number; publicProjects: number }

type Item = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; count?: number; note?: string }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

/**
 * The realty dashboard's frame: a dark sidebar on desktop (a drawer on the phone)
 * with the realty's logo on a white plate, its brand colour as the accent, counts
 * beside each section, a "New offer" shortcut and the account at the foot.
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
        { href: `/${slug}/dashboard/offers`, label: staff ? "Offers" : "My offers", icon: FileText, count: counts?.offers },
      ],
    },
    ...(staff
      ? [{ title: "Team", items: [{ href: `/${slug}/dashboard/agents`, label: "Agents", icon: Users, count: counts?.agents, note: counts?.agentsInvited ? `+${counts.agentsInvited} invited` : undefined }] }]
      : []),
  ]

  const panel = (
    <div className="flex h-full flex-col bg-[#1a1714] text-white">
      <div className="h-[3px] shrink-0 bg-[var(--side-accent)]" />

      {/* Brand */}
      <div className="px-5 pt-6">
        <Link href={`/${slug}/dashboard`} onClick={() => setOpen(false)} className="flex h-[84px] items-center justify-center bg-white px-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--side-accent)]">
          <RealtyMark name={realty.name} logo={realty.logo_url} className="h-14" />
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Dashboard</p>
          <span className="shrink-0 border border-white/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55">{staff ? "Staff" : "Agent"}</span>
        </div>
      </div>

      {/* Primary action */}
      <div className="px-5 pt-6">
        <Link
          href={`/${slug}/dashboard/offers/new`}
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-2 bg-[var(--side-accent)] px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--side-accent-fg)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Plus className="h-4 w-4" /> New offer
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-7 flex-1 space-y-6 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">{g.title}</p>
            <ul className="mt-2">
              {g.items.map(({ href, label, icon: Icon, exact, count, note }) => {
                const active = exact ? path === href : path.startsWith(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 px-5 py-2.5 text-[14.5px] outline-none transition focus-visible:bg-white/[0.08] ${active ? "bg-white/[0.08] font-semibold text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white"}`}
                    >
                      <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] bg-[var(--side-accent)] transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-white" : "text-white/45 group-hover:text-white/80"}`} />
                      <span className="min-w-0 flex-1 truncate">
                        {label}
                        {note && <span className="ml-2 text-[11px] font-normal text-white/40">{note}</span>}
                      </span>
                      {count !== undefined && (
                        <span className={`min-w-[1.75rem] px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums ${active ? "bg-[var(--side-accent)] text-[var(--side-accent-fg)]" : "bg-white/[0.08] text-white/70"}`}>{count}</span>
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
          className="group block border border-white/10 p-4 outline-none transition hover:border-white/25 focus-visible:ring-2 focus-visible:ring-[var(--side-accent)]"
        >
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
              <Globe className="h-3.5 w-3.5" /> {isSite ? "Public site" : "Sign-in page"}
            </p>
            <ArrowUpRight className="h-4 w-4 text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-white">{isSite ? "jvconline.ph" : `jvconline.ph/${slug}/login`}</p>
          <p className="mt-0.5 text-xs text-white/45">
            {isSite ? (counts ? `${counts.publicProjects} project page${counts.publicProjects === 1 ? "" : "s"} live` : "Johndorf's website") : staff ? "Share it with your agents" : "Where you sign in"}
          </p>
        </a>
      </div>

      {/* Account */}
      <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--side-accent)] text-sm font-semibold text-[var(--side-accent-fg)]">{initials(user.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-white/45">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" title="Sign out" aria-label="Sign out" className="flex h-9 w-9 items-center justify-center text-white/50 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--side-accent)]">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f6f4f0] text-[#17150f] lg:grid lg:grid-cols-[280px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">{panel}</aside>

      {/* Phone top bar */}
      <div className="sticky top-0 z-40 border-b border-[#e6e2db] bg-white lg:hidden">
        <div className="h-[3px] bg-[var(--accent)]" />
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={`/${slug}/dashboard`}>
            <RealtyMark name={realty.name} logo={realty.logo_url} className="h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/${slug}/dashboard/offers/new`} className="flex items-center gap-1.5 bg-[var(--accent)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
              <Plus className="h-3.5 w-3.5" /> Offer
            </Link>
            <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 text-[#17150f]">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#17150f]/50" />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] shadow-2xl">
            {panel}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 p-2 text-white/70 hover:text-white">
              <X className="h-5 w-5" />
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
