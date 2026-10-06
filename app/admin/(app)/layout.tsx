import type { Metadata } from "next"
import { requireAdmin } from "@/lib/admin-auth"
import { signOutAdmin } from "../login/actions"
import { AdminNav } from "./nav"

export const metadata: Metadata = { title: { default: "Admin · jvconline", template: "%s · jvconline admin" }, robots: { index: false, follow: false } }

/** Everything under /admin except the login: checks the session, draws the shell. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:items-stretch lg:justify-start lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="flex items-center gap-3 lg:mb-8">
          <span className="text-lg font-semibold tracking-tight">jvconline</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">Admin</span>
        </div>
        <AdminNav />
        <div className="hidden lg:mt-auto lg:block">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-white/50">{user.email}</p>
          <form action={signOutAdmin} className="mt-3">
            <button type="submit" className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60 hover:text-white">
              Sign out
            </button>
          </form>
        </div>
        <form action={signOutAdmin} className="lg:hidden">
          <button type="submit" className="rounded-md border border-white/20 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
            Sign out
          </button>
        </form>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
    </div>
  )
}
