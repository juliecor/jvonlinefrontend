"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, LogIn } from "lucide-react"

/** Johndorf's bar for the project pages: solid, simple, phone-friendly. The landing has its own. */
export function SiteHeader({ light = false }: { light?: boolean }) {
  const path = usePathname()
  const items = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/#news", label: "News" },
  ]
  const tone = light ? "text-white/85 hover:text-white" : "text-[#4b3b37] hover:text-[#b4241c]"
  return (
    <header className={`absolute inset-x-0 top-0 z-40 ${light ? "" : "border-b border-[#ece5e2] bg-white/95 backdrop-blur"}`}>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Johndorf home" className="shrink-0">
          <Image src="/johndorf/logo.png" alt="Johndorf Ventures Corporation" width={391} height={186} className={`h-auto w-[92px] sm:w-[104px] ${light ? "brightness-0 invert" : ""}`} unoptimized />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className={`text-[13px] font-semibold tracking-wide transition-colors ${tone} ${path === n.href ? (light ? "text-white" : "text-[#b4241c]") : ""}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/johndorf/montierra" className={`hidden items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] transition sm:inline-flex ${light ? "border border-white/30 text-white hover:bg-white/10" : "bg-[#b4241c] text-white hover:bg-[#941414]"}`}>
            <Compass className="h-4 w-4" /> Montierra map
          </Link>
          <Link href="/johndorf/login" className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] transition ${light ? "border-white/30 text-white hover:bg-white/10" : "border-[#2a1d1b]/20 text-[#2a1d1b] hover:border-[#b4241c] hover:text-[#b4241c]"}`}>
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        </div>
      </div>
    </header>
  )
}
