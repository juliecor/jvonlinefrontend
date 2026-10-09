import { redirect } from "next/navigation"
import { api } from "@/lib/api"
import { setOfferAccess } from "../access"

/**
 * The link in a reminder email: /offer/<code>/enter?k=<key>. The key stands in for the buyer's username and
 * password, so they land on their requirements already signed in, with what's missing marked. A key that has
 * run out (or an offer that's gone) just drops them on the normal sign-in page.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const key = new URL(request.url).searchParams.get("k") ?? ""
  const offer = `/offer/${encodeURIComponent(code)}`

  let opened = false
  if (key) {
    try {
      const { token } = await api<{ token: string | null }>(`${offer.replace("/offer/", "/offers/")}/enter`, { method: "POST", body: { key } })
      if (token) await setOfferAccess(code, token)
      opened = true
    } catch {
      // Expired or wrong: fall through to the sign-in page.
    }
  }
  redirect(opened ? `${offer}?guide=1#requirements` : offer)
}
