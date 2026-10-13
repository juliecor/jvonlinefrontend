"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, BadgeCheck, Ban, Building2, ChevronDown, ClipboardCheck, FileText, Handshake, Landmark, LayoutDashboard, ListChecks, LogOut, Menu, Plus, ShieldCheck, Sparkles, UserCog, UserRound, UsersRound, Users, X } from "lucide-react"
import { Feedback } from "@/components/feedback"
import { AskPanel } from "./ai/ask-panel"
import { RealtyMark } from "@/components/form"
import { assistantName } from "@/lib/assistant-name"
import { shortDate, todayManila } from "@/lib/format"
import { type ViewRealty, RoleSwitch } from "@/components/role-switch"
import { SITE_REALTY } from "@/lib/public-projects-types"
import type { RealtyUser } from "@/lib/realty-auth"
import { type Section, can, isBroker, isDeveloperStaff } from "@/lib/realty-roles"

/** What a super admin gets on top of the realty's own dashboard: the platform's realties and people, and View as. */
export type SuperAdminNav = { realties: ViewRealty[]; realtyCount: number | null; peopleCount: number | null }

export type ShellCounts = { projects: number; offers: number; agents: number; agentsInvited: number; agentsPending: number; publicProjects: number; newResponses: number; toApprove: number; realtiesPending: number; myTasks?: number; myTasksOverdue?: number }

type Item = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; count?: number; note?: string; alert?: string }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

/**
 * The realty dashboard's frame: a plain light sidebar on desktop (a drawer on the phone) with the
 * realty's logo and a link to its public site, the signed-in person's card (photo, name, role; My
 * account and Sign out under it), a "New offer" button, and the sections with an icon each and a quiet
 * count (a red badge when something waits).
 */
export function DashboardShell({ slug, user, counts, superAdmin, signOutAction, children }: { slug: string; user: RealtyUser; counts: ShellCounts | null; superAdmin: SuperAdminNav | null; signOutAction: () => Promise<void>; children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const account = `/${slug}/dashboard/account`
  const realty = user.realty
  const staff = user.role === "realty"
  // Johndorf is the developer: its admins edit the inventory, approve terms and accept realties. An accredited
  // realty (a broker) sells that inventory through its own agents and sees only what it needs for that.
  const broker = isBroker(user)
  const developerStaff = isDeveloperStaff(user)
  const isSite = slug === SITE_REALTY

  // A staff member sees only the sections their admin gave them (see Team > Staff).
  const may = (section: Section) => can(user, section)
  // A broker whose accreditation ran out or was ended makes no new offers until the developer renews it.
  const accreditation = broker ? realty.accreditation : null
  const stopped = accreditation?.active === false
  const daysLeft = accreditation?.until ? Math.round((Date.parse(`${accreditation.until}T00:00:00Z`) - Date.parse(`${todayManila()}T00:00:00Z`)) / 86400000) : null
  const endingSoon = !stopped && daysLeft !== null && daysLeft <= 30
  const newOffer = may("offers") && !stopped

  // Anything waiting on this person: buyer updates, offers to approve, and (for staff) agents to approve.
  const waiting = (counts?.myTasksOverdue ?? 0) + (may("offers") ? (counts?.newResponses ?? 0) : 0) + (developerStaff && may("approvals") ? (counts?.toApprove ?? 0) : 0) + (staff && may("agents") ? (counts?.agentsPending ?? 0) : 0) + (developerStaff && may("realties") ? (counts?.realtiesPending ?? 0) : 0)

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Workspace",
      items: [
        { href: `/${slug}/dashboard`, label: "Overview", icon: LayoutDashboard, exact: true },
        // The AI assistant: answers from this realty's data (Johndorf's own team only).
        ...(broker || !may("ai") ? [] : [{ href: `/${slug}/dashboard/ai`, label: assistantName(realty.name), icon: Sparkles }]),
        // Everyone has their own tasks; staff with the Tasks section see and give out everyone's.
        { href: `/${slug}/dashboard/tasks`, label: staff && may("tasks") ? "Tasks" : "My tasks", icon: ListChecks, count: counts?.myTasks || undefined, alert: counts?.myTasksOverdue ? `${counts.myTasksOverdue} late` : undefined },
      ],
    },
    {
      title: "Sales",
      items: [
        { href: `/${slug}/dashboard/projects`, label: "Projects", icon: Building2, count: counts?.projects },
        ...(may("offers") ? [{ href: `/${slug}/dashboard/offers`, label: staff ? "Offers" : "My offers", icon: FileText, count: counts?.offers, alert: counts?.newResponses ? `${counts.newResponses} new` : undefined }] : []),
        ...(developerStaff && may("approvals") ? [{ href: `/${slug}/dashboard/approvals`, label: "Approvals", icon: BadgeCheck, count: counts?.toApprove, alert: counts?.toApprove ? "to do" : undefined }] : []),
      ],
    },
    ...(staff
      ? [
          {
            title: "Team",
            items: [
              ...(may("agents") ? [{ href: `/${slug}/dashboard/agents`, label: "Agents", icon: Users, count: counts?.agents, note: counts?.agentsInvited ? `+${counts.agentsInvited} invited` : undefined, alert: counts?.agentsPending ? `${counts.agentsPending} to approve` : undefined }] : []),
              // Realties accredited under this developer: invite, review their form, accept.
              ...(developerStaff && may("realties") ? [{ href: `/${slug}/dashboard/realties`, label: "Realties", icon: Handshake, alert: counts?.realtiesPending ? `${counts.realtiesPending} to review` : undefined }] : []),
              // The realty's own staff accounts and what each may use (full admins).
              ...(may("staff") ? [{ href: `/${slug}/dashboard/staff`, label: "Staff", icon: UserCog }] : []),
              // An accredited realty's own accreditation: its period and the signed agreement.
              ...(broker ? [{ href: `/${slug}/dashboard/accreditation`, label: "Accreditation", icon: ShieldCheck, alert: stopped ? "ended" : endingSoon ? "ends soon" : undefined }] : []),
            ],
          },
          ...(developerStaff && may("requirements") ? [{ title: "Setup", items: [{ href: `/${slug}/dashboard/requirements`, label: "Buyer requirements", icon: ClipboardCheck }] }] : []),
        ].filter((g) => g.items.length > 0)
      : []),
    ...(superAdmin
      ? [
          {
            title: "Super admin",
            items: [
              { href: `/${slug}/dashboard/platform/realties`, label: "Realties", icon: Landmark, count: superAdmin.realtyCount ?? undefined },
              { href: `/${slug}/dashboard/platform/people`, label: "People", icon: UsersRound, count: superAdmin.peopleCount ?? undefined },
            ],
          },
        ]
      : []),
  ]

  const publicLink = (
    <Link
      href={isSite ? "/" : `/${slug}/login`}
      title={isSite ? (counts ? `${counts.publicProjects} project pages live` : "Johndorf's website") : staff ? "Share it with your agents" : "Where you sign in"}
      className="inline-flex shrink-0 items-center gap-1 border border-[#e6e2db] px-2.5 py-1 text-xs font-semibold text-[#2b2823] outline-none transition hover:border-[#17150f] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      {isSite ? "Public site" : "Sign-in page"} <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  )

  const panel = (
    <div className="flex h-full flex-col border-r border-[#e8e5df] bg-white text-[#17150f]">
      {/* Brand */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <Link href={`/${slug}/dashboard`} onClick={() => setOpen(false)} className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          <RealtyMark name={realty.name} logo={realty.logo_url} className="h-9" />
        </Link>
        {publicLink}
      </div>

      {/* Who is signed in: their photo, name and role; My account and Sign out under the arrow. */}
      <div className="px-4 pt-4">
        <ProfileCard
          name={user.name}
          photo={user.photo_url ?? null}
          role={staff ? "Admin" : "Agent"}
          // An accredited realty works inside Johndorf's brand, under its own name.
          sub={broker ? realty.name : null}
          account={account}
          accountActive={path === account}
          signOutAction={signOutAction}
          onNavigate={() => setOpen(false)}
        />
      </div>

      {/* Primary action */}
      {newOffer && (
        <div className="px-4 pt-3">
          <Link
            href={`/${slug}/dashboard/offers/new`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 bg-[var(--accent)] px-3 py-3 text-[15px] font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} /> New offer
          </Link>
        </div>
      )}

      {/* Navigation: groups split by a thin line */}
      <nav className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
        {groups.map((g, gi) => (
          <ul key={g.title} aria-label={g.title} className={`space-y-0.5 ${gi > 0 ? "mt-2 border-t border-[#f0ede8] pt-2" : ""}`}>
            {g.items.map(({ href, label, icon: Icon, exact, count, alert }) => {
              const active = exact ? path === href : path.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 px-2 py-1 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${active ? "bg-[#f2f0ec] font-semibold text-[#17150f] shadow-[inset_3px_0_0_var(--accent)]" : "font-medium text-[#2b2823] hover:bg-[#f7f6f3] hover:text-[#17150f]"}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center transition ${active ? "bg-[var(--accent)] text-white" : "bg-[#f3f1ed] text-[#6b665d] group-hover:bg-[#ebe8e2] group-hover:text-[#2b2823]"}`}>
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {/* Something waiting gets a small red badge; otherwise a quiet count. */}
                    {alert ? (
                      <span className="shrink-0 bg-[var(--accent)] px-1.5 py-0.5 text-xs font-semibold text-white">{alert}</span>
                    ) : (
                      count !== undefined && <span className="shrink-0 pr-1 text-[13px] font-medium tabular-nums text-[#6b665d]">{count}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        ))}

        {superAdmin && (
          <div className="mt-3 border-t border-[#f0ede8] px-2 pt-3">
            <p className="pb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a847a]">View as</p>
            <RoleSwitch from="realty" current={`${slug}:${user.role}`} realties={superAdmin.realties} tone="light" />
          </div>
        )}
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f6f4f0] text-[#17150f] lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">{panel}</aside>

      {/* Phone top bar */}
      <div className="sticky top-0 z-40 border-b border-[#e8e5df] bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={`/${slug}/dashboard`}>
            <RealtyMark name={realty.name} logo={realty.logo_url} className="h-9" />
          </Link>
          <div className="flex items-center gap-2">
            {newOffer && (
              <Link href={`/${slug}/dashboard/offers/new`} className="flex items-center gap-1.5 bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white">
                <Plus className="h-4 w-4" strokeWidth={2.5} /> Offer
              </Link>
            )}
            <button type="button" onClick={() => setOpen(true)} aria-label={waiting ? `Open menu, ${waiting} things need you` : "Open menu"} className="relative p-2 text-[#17150f]">
              <Menu className="h-6 w-6" />
              {!!waiting && <span aria-hidden className="absolute right-1 top-1 h-2.5 w-2.5 border-2 border-white bg-[var(--accent)]" />}
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
        <div className="mx-auto max-w-5xl">
          {stopped && (
            <div role="status" className="mb-8 flex flex-col gap-2 border-l-4 border-red-600 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2.5 text-[15px] font-semibold text-red-900">
                <Ban className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  Your accreditation with {realty.developer?.name ?? "the developer"} {accreditation?.ended ? "was ended" : `ended on ${shortDate(accreditation?.until)}`}. You can&apos;t make new offers until they renew it.
                </span>
              </p>
              {staff && (
                <Link href={`/${slug}/dashboard/accreditation`} className="shrink-0 text-sm font-bold text-red-800 underline-offset-4 hover:underline">
                  See accreditation
                </Link>
              )}
            </div>
          )}
          {children}
        </div>
        <p className="mt-16 text-center text-xs text-[#a39d92]">
          Powered by <Link href="/platform" className="font-medium text-[#8a847a] hover:text-[#17150f]">jvconline</Link>
        </p>
      </main>
      {!broker && may("ai") && <AskPanel slug={slug} name={assistantName(realty.name)} isAgent={user.role === "agent"} />}
      <Feedback />
    </div>
  )
}

/** The signed-in person: photo (or initials), name and role; a click opens My account and Sign out. */
function ProfileCard({ name, photo, role, sub, account, accountActive, signOutAction, onNavigate }: { name: string; photo: string | null; role: string; sub: string | null; account: string; accountActive: boolean; signOutAction: () => Promise<void>; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", away)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", away)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  const item = "flex w-full items-center gap-3 px-4 py-2.5 text-[15px] font-medium text-[#2b2823] outline-none hover:bg-[#f7f6f3] focus-visible:bg-[#f7f6f3]"
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex w-full items-center gap-3 border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${open || accountActive ? "border-[#d9d4cb] bg-[#f7f6f3]" : "border-[#e8e5df] bg-[#fbfaf8] hover:border-[#d9d4cb]"}`}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[var(--accent)]/25" />
        ) : (
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#17150f] text-[15px] font-semibold text-white">
            {initials(name)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 break-words text-[15px] font-bold leading-snug text-[#17150f]">{name}</span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--accent)]" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 10%, white)" }}>
              {role}
            </span>
            {sub && <span className="truncate text-xs text-[#6b665d]">{sub}</span>}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#8a847a] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute inset-x-0 top-full z-30 mt-1 border border-[#e8e5df] bg-white py-1 shadow-lg">
          <Link
            href={account}
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onNavigate()
            }}
            className={item}
          >
            <UserRound className="h-[18px] w-[18px] text-[#6b665d]" strokeWidth={1.9} /> My account
          </Link>
          <form action={signOutAction}>
            <button type="submit" role="menuitem" className={item}>
              <LogOut className="h-[18px] w-[18px] text-[#6b665d]" strokeWidth={1.9} /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
