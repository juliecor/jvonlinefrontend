import "server-only"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import type { MilestoneInput } from "@/lib/schedule"
import type { Project, ProjectDetail } from "../../projects/types"

/** What the New offer form needs: every active project that still has an available unit with a price, with its units and plans. */
export async function loadNewOffer(slug: string) {
  const { user, token } = await requireRealtyUser(slug)
  const list = (await api<Project[]>("/realty/projects", { token })).filter((p) => p.status === "active")
  const projects = (await Promise.all(list.map((p) => api<ProjectDetail>(`/realty/projects/${p.id}`, { token })))).filter((p) => p.units.some((u) => u.price !== null && u.status === "available"))
  return { user, projects }
}

/** Custom terms in the address (from "Make offer with these terms"): checked, or left out. */
export function termsFromQuery(raw: string | undefined): MilestoneInput[] | undefined {
  if (!raw) return undefined
  try {
    const rows = JSON.parse(raw)
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 24) return undefined
    const ok = rows.every((m) => m && typeof m.label === "string" && typeof m.percent === "number" && m.percent > 0 && (m.days === null || typeof m.days === "number"))
    return ok ? rows.map((m) => ({ label: m.label.slice(0, 120), percent: m.percent, days: m.days, months: typeof m.months === "number" ? m.months : null })) : undefined
  } catch {
    return undefined
  }
}
