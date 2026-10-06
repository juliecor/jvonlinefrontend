import { letterIcon } from "@/lib/brand-icon"

export const dynamic = "force-static"

/** jvconline's own tab icon: the admin, the platform page, registration. */
export function GET() {
  return letterIcon("jv", "#17150f")
}
