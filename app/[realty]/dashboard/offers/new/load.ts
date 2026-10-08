import "server-only"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import type { Project, ProjectDetail } from "../../projects/types"

/** What the New offer form needs: every active project that still has an available unit with a price, with its units and plans. */
export async function loadNewOffer(slug: string) {
  const { user, token } = await requireRealtyUser(slug)
  const list = (await api<Project[]>("/realty/projects", { token })).filter((p) => p.status === "active")
  const projects = (await Promise.all(list.map((p) => api<ProjectDetail>(`/realty/projects/${p.id}`, { token })))).filter((p) => p.units.some((u) => u.price !== null && u.status === "available"))
  return { user, projects }
}
