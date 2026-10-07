"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutDashboard, LogIn } from "lucide-react"

type Session = { name: string; dashboard: string } | null

/** Asks /auth/session once per page whether this browser is signed in to a realty dashboard. */
export function useSiteSession(): Session {
  const [session, setSession] = useState<Session>(null)
  useEffect(() => {
    let live = true
    fetch("/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Session) => live && setSession(s?.dashboard ? s : null))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return session
}

/** "Sign in" on the public pages, or "Dashboard" once you're signed in. */
export function AccountLink({ className, signIn = "Sign in", dashboard = "Dashboard", icon = true, onClick }: { className: string; signIn?: string; dashboard?: string; icon?: boolean; onClick?: () => void }) {
  const session = useSiteSession()
  return session ? (
    <Link href={session.dashboard} onClick={onClick} className={className}>
      {icon && <LayoutDashboard className="h-4 w-4" />} {dashboard}
    </Link>
  ) : (
    <Link href="/johndorf/login" onClick={onClick} className={className}>
      {icon && <LogIn className="h-4 w-4" />} {signIn}
    </Link>
  )
}
