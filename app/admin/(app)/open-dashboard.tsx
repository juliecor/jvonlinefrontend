"use client"

import { useTransition } from "react"
import { LayoutDashboard, LoaderCircle } from "lucide-react"
import { btn } from "@/components/dashboard-ui"
import { switchView } from "@/app/view-as/actions"

/** Super admins only: step into a realty's dashboard as its admin (Switch role covers the agent view). */
export function OpenDashboard({ slug }: { slug: string }) {
  const [pending, start] = useTransition()
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => void (await switchView("admin", { role: "realty", realty: slug })))} className={btn.outline}>
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LayoutDashboard className="h-4 w-4" />} Open dashboard
    </button>
  )
}
