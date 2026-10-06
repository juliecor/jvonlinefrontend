"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, ExternalLink, FileText, LayoutDashboard, Menu, Users, X } from "lucide-react"
import { RealtyMark } from "@/components/form"
import type { RealtyUser } from "@/lib/realty-auth"

type Item = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }

/** Sidebar on desktop, a top bar with a drawer on the phone. The realty's logo and colour, jvconline's structure. */
export function DashboardShell({ slug, user, signOut, children }: { slug: string; user: RealtyUser; signOut: React.ReactNode; children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const realty = user.realty
  const staff = user.role === "realty"

  const groups: { title: string; items: Item[] }[] = [
    { title: "Workspace", items: [{ href: `/${slug}/dashboard`, label: "Overview", icon: LayoutDashboard, exact: true }] },
    {
      title: "Sales",
      items: [
        { href: `/${slug}/dashboard/projects`, label: "Projects", icon: Building2 },
        { href: `/${slug}/dashboard/offers`, label: "Offers", icon: FileText },
      ],
    },
    ...(staff ? [{ title: "Team", items: [{ href: `/${slug}/dashboard/agents`, label: "Agents", icon: Users }] }] : []),
  ]

  const nav = (
    <nav className="flex-1 space-y-7">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a39d92]">{g.title}</p>
          <ul className="mt-2">
            {g.items.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? path === href : path.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 px-4 py-2.5 text-[15px] transition ${active ? "font-semibold text-[#17150f]" : "text-[#6b665d] hover:text-[#17150f]"}`}
                  >
                    <span aria-hidden className={`absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-[var(--accent)] transition-opacity ${active ? "opacity-100" : "opacity-0"}`} />
                    <Icon className={`h-[18px] w-[18px] ${active ? "text-[var(--accent)]" : "text-[#a39d92]"}`} />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  const person = (
    <div className="border-t border-[#e6e2db] px-4 pt-4">
      <p className="truncate text-sm font-semibold text-[#17150f]">{user.name}</p>
      <p className="truncate text-xs text-[#8a847a]">{staff ? "Realty staff" : "Agent"} · {user.email}</p>
      <div className="mt-3 flex items-center gap-3">
        {signOut}
        <Link href={`/${slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-[#6b665d] hover:text-[var(--accent)]">
          Public page <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f6f4f0] text-[#17150f] lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-[#e6e2db] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:py-7">
        <div className="h-1 bg-[var(--accent)]" style={{ marginTop: "-1.75rem", marginBottom: "1.5rem" }} />
        <Link href={`/${slug}/dashboard`} className="mb-9 block px-6">
          <RealtyMark name={realty.name} logo={realty.logo_url} className="h-11" />
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a39d92]">Dashboard</p>
        </Link>
        {nav}
        {person}
      </aside>

      {/* Phone top bar */}
      <div className="sticky top-0 z-40 border-b border-[#e6e2db] bg-white lg:hidden">
        <div className="h-0.5 bg-[var(--accent)]" />
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={`/${slug}/dashboard`}>
            <RealtyMark name={realty.name} logo={realty.logo_url} className="h-8" />
          </Link>
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-2 text-[#17150f]">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#17150f]/40" />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-white py-6 shadow-2xl">
            <div className="mb-8 flex items-start justify-between px-5">
              <RealtyMark name={realty.name} logo={realty.logo_url} className="h-10" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="-mr-2 rounded-md p-2 text-[#17150f]">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {person}
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
