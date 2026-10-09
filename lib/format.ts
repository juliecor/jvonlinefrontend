/** Money and dates the Philippine way, shared by the dashboards and the buyer's offer page. */

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
const pesoExact = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const php = (n: number | string | null | undefined) => (n === null || n === undefined || n === "" ? "—" : peso.format(Number(n)))
export const phpExact = (n: number | string) => pesoExact.format(Number(n))

export const longDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "—"

export const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "—"

/** "Oct 12, 3:30 PM" in Manila: when an offer closes. */
export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }) : "—"

export const sqm = (n: number | string | null | undefined) => (n === null || n === undefined || n === "" ? "—" : `${Number(n).toLocaleString("en-PH", { maximumFractionDigits: 2 })} sqm`)

/** Today's date as YYYY-MM-DD in Manila, for date inputs. */
export const todayManila = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })

/** "just now", "5 min ago", "3 hours ago", "yesterday", "4 days ago", then the short date — for leads and views. */
export const timeAgo = (iso: string | null | undefined) => {
  if (!iso) return "—"
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  return shortDate(iso)
}

/** "Good morning" / "Good afternoon" / "Good evening", by the clock in Manila. */
export const greeting = () => {
  const h = Number(new Date().toLocaleString("en-PH", { hour: "numeric", hour12: false, timeZone: "Asia/Manila" }))
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
}

const unitNameCollator = new Intl.Collator("en", { numeric: true })

/** Sorts "Bldg T · Unit 108" before "Bldg T · Unit 1037" — plain string order would put 1037 first. */
export const byUnitName = (a: { name: string }, b: { name: string }) => unitNameCollator.compare(a.name, b.name)
