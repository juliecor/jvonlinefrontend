import { initials, letterIcon } from "@/lib/brand-icon"
import { realtyBySlug } from "@/lib/realty-auth"

/** /<realty>/icon.png — a realty's tab icon: its initials on its brand colour (Johndorf uses its own mark; see lib/realty-icon.ts). */
export async function GET(_: Request, { params }: { params: Promise<{ realty: string }> }) {
  const realty = await realtyBySlug((await params).realty)
  const icon = letterIcon(initials(realty.name), realty.accent_color)
  icon.headers.set("Cache-Control", "public, max-age=3600")
  return icon
}
