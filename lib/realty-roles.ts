/**
 * What kind of realty someone belongs to. Johndorf is the developer: it owns the
 * projects and units. An accredited realty is a broker: its people sell those units
 * through offers but never edit them, approve custom terms or check a buyer's files.
 * Plain functions with no server-only imports, so client components can use them too.
 */

type Member = { role: string; realty: { kind?: "developer" | "broker" } }

export const isBroker = (user: Member) => user.realty.kind === "broker"

/** Johndorf's admins: edit projects and units, approve terms, accept realties. */
export const isDeveloperStaff = (user: Member) => user.role === "realty" && !isBroker(user)

/** Johndorf's admins and agents: the people who work with the inventory itself. */
export const isDeveloperMember = (user: Member) => !isBroker(user)
