"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, RefreshCw } from "lucide-react"

/**
 * While the application is pending, the page checks again by itself every 20 seconds and whenever the
 * tab comes back into view, and the button checks right now. Once it is decided the page stops asking.
 */
export function PendingStatus({ waiting }: { waiting: boolean }) {
  const router = useRouter()
  const [checking, start] = useTransition()
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)

  const check = () =>
    start(() => {
      router.refresh()
      setCheckedAt(new Date())
    })

  useEffect(() => {
    if (!waiting) return
    const every = setInterval(() => router.refresh(), 20_000)
    const back = () => document.visibilityState === "visible" && router.refresh()
    document.addEventListener("visibilitychange", back)
    return () => {
      clearInterval(every)
      document.removeEventListener("visibilitychange", back)
    }
  }, [waiting, router])

  if (!waiting) return null

  return (
    <div>
      <button type="button" onClick={check} disabled={checking} className="inline-flex w-full items-center justify-center gap-2 border border-[#17150f] bg-white px-6 py-3.5 text-base font-bold text-[#17150f] transition hover:bg-[#17150f] hover:text-white disabled:opacity-60">
        {checking ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
        Check again
      </button>
      <p aria-live="polite" className="mt-2 text-center text-xs text-[#8a847a]">
        {checkedAt ? `Checked at ${checkedAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}. Still pending.` : "This page checks for you every few seconds."}
      </p>
    </div>
  )
}
