"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, Building2, FileText, Globe, LayoutDashboard, LogOut, Menu, Plus, Settings, Users, X } from "lucide-react"
import { Feedback } from "@/components/feedback"
import { type ViewRealty, RoleSwitch } from "@/components/role-switch"
import type { AuthUser } from "@/lib/admin-auth"

export type AdminCounts = { realties: number; invited: number; people: number; offers: number }

type Item = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; count?: number; note?: string }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

const tint = (pct: number) => `color-mix(in srgb, var(--accent) ${pct}%, white)`

/**
 * The platform admin's frame, built like a realty's dashboard (same sidebar,
 * type and spacing) in jvconline's own ink. Super admins get Switch role here.
 */
export function AdminShell({ user, counts, realties, signOutAction, children }: { user: AuthUser; counts: AdminCounts | null; realties: ViewRealty[] | null; signOutAction: () => Promise<void>; children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const account = "/admin/account"

  const groups: { title: string; items: Item[] }[] = [
    { title: "Workspace", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
    {
      title: "Platform",
      items: [
        { href: "/admin/realties", label: "Realties", icon: Building2, count: counts?.realties, note: counts?.invited ? `+${counts.invited} invited` : undefined },
        { href: "/admin/people", label: "People", icon: Users, count: counts?.people },
        { href: "/admin/offers", label: "Offers", icon: FileText, count: counts?.offers },
      ],
    },
  ]

  const panel = (
    <div className="flex h-full flex-col border-r border-[#e6e2db] bg-white text-[#17150f]">
      <div className="h-1 shrink-0 bg-[var(--accent)]" />

      {/* Brand */}
      <div className="border-b border-[#efebe5] px-6 pb-5 pt-6">
        <Link href="/admin" onClick={() => setOpen(false)} className="text-[28px] font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          jvconline
        </Link>
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-[#6b665d]">Dashboard</p>
          <span className={`shrink-0 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${user.is_superadmin ? "bg-amber-300 text-[#17150f]" : "bg-[#f3f0eb] text-[#3d3a34]"}`}>{user.is_superadmin ? "Super admin" : "Admin"}</span>
        </div>
      </div>

      {/* Primary action */}
      <div className="px-5 pt-5">
        <Link
          href="/admin/realties#invite"
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-3.5 text-[15px] font-bold text-white outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} /> Invite a realty
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-6 text-xs font-bold uppercase tracking-[0.16em] text-[#8a847a]">{g.title}</p>
            <ul className="mt-2 space-y-0.5 px-3">
              {g.items.map(({ href, label, icon: Icon, exact, count, note }) => {
                const active = exact ? path === href : path.startsWith(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      style={active ? { backgroundColor: tint(8) } : undefined}
                      className={`group relative flex items-center gap-3 px-3 py-3 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${active ? "font-bold text-[#17150f]" : "font-semibold text-[#3d3a34] hover:bg-[#f6f4f0] hover:text-[#17150f]"}`}
                    >
                      <span aria-hidden className={`absolute inset-y-1.5 left-0 w-1 bg-[var(--accent)] transition-opacity ${active ? "opacity-100" : "opacity-0"}`} />
                      <Icon className={`h-5 w-5 shrink-0 ${active ? "text-[var(--accent)]" : "text-[#8a847a] group-hover:text-[#3d3a34]"}`} strokeWidth={active ? 2.25 : 2} />
                      <span className="min-w-0 flex-1 truncate">
                        {label}
                        {note && <span className="ml-2 text-xs font-semibold text-[#8a847a]">{note}</span>}
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

        {realties && (
          <div>
            <p className="px-6 text-xs font-bold uppercase tracking-[0.16em] text-[#8a847a]">Switch role</p>
            <div className="mt-2 px-5">
              <RoleSwitch from="admin" current="admin" realties={realties} tone="light" />
              <p className="mt-2 hidden text-sm text-[#6b665d] lg:block">See any realty&apos;s dashboard as its admin or an agent.</p>
            </div>
          </div>
        )}
      </nav>

      {/* Public site */}
      <div className="px-5 pb-5 pt-5">
        <Link href="/" className="group block border border-[#e6e2db] bg-[#faf8f5] p-4 outline-none transition hover:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6b665d]">
              <Globe className="h-4 w-4 text-[var(--accent)]" /> Public site
            </p>
            <ArrowUpRight className="h-4 w-4 text-[#8a847a] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
          </div>
          <p className="mt-2 truncate text-[15px] font-bold text-[#17150f]">jvconline.ph</p>
          <p className="mt-0.5 text-sm text-[#6b665d]">The public website</p>
        </Link>
      </div>

      {/* Account */}
      <div className="flex items-center gap-1 border-t border-[#e6e2db] px-3 py-3">
        <Link href={account} onClick={() => setOpen(false)} title="My account" className={`group flex min-w-0 flex-1 items-center gap-3 px-2 py-1.5 outline-none transition hover:bg-[#f6f4f0] focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${path === account ? "bg-[#f6f4f0]" : ""}`}>
          <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--accent)] text-[15px] font-bold text-white">{initials(user.name)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-bold text-[#17150f]">{user.name}</span>
            <span className="flex items-center gap-1 truncate text-sm text-[#6b665d] group-hover:text-[var(--accent)]">
              <Settings className="h-3.5 w-3.5 shrink-0" /> My account
            </span>
          </span>
        </Link>
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
          <Link href="/admin" className="text-2xl font-bold tracking-tight">
            jvconline
          </Link>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${user.is_superadmin ? "bg-amber-300 text-[#17150f]" : "bg-[#f3f0eb] text-[#3d3a34]"}`}>{user.is_superadmin ? "Super admin" : "Admin"}</span>
            <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 text-[#17150f]">
              <Menu className="h-6 w-6" />
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
      <Feedback />
    </div>
  )
}
