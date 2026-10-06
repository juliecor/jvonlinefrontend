/** Money and dates the Philippine way, shared by the dashboards and the buyer's offer page. */

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
const pesoExact = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const php = (n: number | string | null | undefined) => (n === null || n === undefined || n === "" ? "—" : peso.format(Number(n)))
export const phpExact = (n: number | string) => pesoExact.format(Number(n))

export const longDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "—"

export const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "—"

export const sqm = (n: number | string | null | undefined) => (n === null || n === undefined || n === "" ? "—" : `${Number(n).toLocaleString("en-PH", { maximumFractionDigits: 2 })} sqm`)

/** Today's date as YYYY-MM-DD in Manila, for date inputs. */
export const todayManila = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
