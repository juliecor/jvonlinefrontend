"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, FileText, LayoutDashboard, Users } from "lucide-react"

export function RealtyNav({ slug, role }: { slug: string; role: "realty" | "agent" }) {
  const path = usePathname()
  const items = [
    { href: `/${slug}/dashboard`, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `/${slug}/dashboard/projects`, label: "Projects", icon: Building2, exact: false },
    { href: `/${slug}/dashboard/offers`, label: "Offers", icon: FileText, exact: false },
    // Agents are managed by the realty's staff, not by agents.
    ...(role === "realty" ? [{ href: `/${slug}/dashboard/agents`, label: "Agents", icon: Users, exact: false }] : []),
  ]
  return (
    <nav className="order-last flex w-full gap-1 overflow-x-auto border-t border-slate-100 pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        )
      })}
    </nav>
  )
}
