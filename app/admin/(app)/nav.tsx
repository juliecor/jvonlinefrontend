"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, LayoutDashboard } from "lucide-react"

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/realties", label: "Realties", icon: Building2 },
]

export function AdminNav() {
  const path = usePathname()
  return (
    <nav className="flex gap-1 lg:flex-col">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-white text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
