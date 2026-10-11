import Link from "next/link"
import { Ban } from "lucide-react"
import { shortDate } from "@/lib/format"
import type { RealtyUser } from "@/lib/realty-auth"

/** A broker whose accreditation ran out or was ended: no new offers until the developer renews it (Laravel refuses them too). */
export const offersStopped = (user: RealtyUser) => user.realty.kind === "broker" && user.realty.accreditation?.active === false

export function OffersStopped({ user }: { user: RealtyUser }) {
  const a = user.realty.accreditation
  const developer = user.realty.developer?.name ?? "the developer"
  return (
    <div className="border-l-4 border-red-600 bg-red-50 px-5 py-5">
      <p className="flex items-center gap-2 text-lg font-bold text-red-900">
        <Ban className="h-5 w-5" /> New offers are paused
      </p>
      <p className="mt-2 text-[15px] text-red-900">
        Your accreditation with {developer} {a?.ended ? "was ended" : `ended on ${shortDate(a?.until)}`}. Ask {developer} to renew it to make new offers. Offers you already made carry on.
      </p>
      {user.role === "realty" && (
        <Link href={`/${user.realty.slug}/dashboard/accreditation`} className="mt-3 inline-block text-sm font-bold text-red-800 underline-offset-4 hover:underline">
          See your accreditation
        </Link>
      )}
    </div>
  )
}
