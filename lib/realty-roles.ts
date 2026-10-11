/**
 * What kind of realty someone belongs to. Johndorf is the developer: it owns the
 * projects and units. An accredited realty is a broker: its people sell those units
 * through offers but never edit them, approve custom terms or check a buyer's files.
 * Plain functions with no server-only imports, so client components can use them too.
 */

type Member = { role: string; realty: { kind?: "developer" | "broker" }; access?: string[] }

export const isBroker = (user: Member) => user.realty.kind === "broker"

/** Johndorf's admins: edit projects and units, approve terms, accept realties. */
export const isDeveloperStaff = (user: Member) => user.role === "realty" && !isBroker(user)

/** Johndorf's admins and agents: the people who work with the inventory itself. */
export const isDeveloperMember = (user: Member) => !isBroker(user)

/** The dashboard sections a realty's admin gives a staff member; "staff" (managing staff accounts) is for full admins. */
export type Section = "offers" | "approvals" | "projects" | "agents" | "realties" | "requirements" | "ai" | "staff"

/**
 * May this person use a section? Staff: only what their admin gave them (an
 * older session without the list counts as a full admin). Agents: their own
 * offers and the AI, as before; never the admin sections.
 */
export function can(user: { role: string; access?: string[] }, section: Section): boolean {
  if (user.role === "realty") return user.access === undefined || user.access.includes(section)
  return user.role === "agent" && (section === "offers" || section === "ai")
}
