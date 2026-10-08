"use client"

import { useTransition } from "react"
import { LoaderCircle } from "lucide-react"
import { confirmAction, toast } from "@/components/feedback"
import { voidOffer } from "./actions"

/** Void asks first: the buyer's link stops working for good. */
export function VoidOfferButton({ slug, id, buyer, className, children }: { slug: string; id: number; buyer: string; className: string; children: React.ReactNode }) {
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 disabled:opacity-60 ${className}`}
      onClick={async () => {
        const ok = await confirmAction({
          title: `Void the offer for ${buyer}?`,
          body: "The buyer's link stops working right away, and they're told to ask for a new offer. Responses already received stay here. This can't be undone.",
          confirm: "Void offer",
          danger: true,
        })
        if (!ok) return
        start(async () => {
          const r = await voidOffer(slug, id)
          if (r.error) toast(r.error, "error")
          else toast(`Offer for ${buyer} voided`)
        })
      }}
    >
      {pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  )
}
