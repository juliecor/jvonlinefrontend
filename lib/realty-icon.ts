import type { Metadata } from "next"
import { SITE_REALTY } from "./public-projects-types"

/** The browser-tab icon for a realty's pages and offers: Johndorf's mark, or the realty's initials (app/[realty]/icon.png). */
export function realtyIcons(slug: string): Metadata["icons"] {
  const icon = slug === SITE_REALTY ? "/johndorf/mark.png" : `/${encodeURIComponent(slug)}/icon.png`
  return { icon, apple: icon }
}
