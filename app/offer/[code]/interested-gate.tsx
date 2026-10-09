"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

/** A private offer's first screen: the sales-offer sheet. "I'm interested" is what brings up the sign-in. */
export function InterestedGate({ sheet, signIn, accent }: { sheet: React.ReactNode; signIn: React.ReactNode; accent: string }) {
  const [signingIn, setSigningIn] = useState(false)

  const go = (next: boolean) => {
    setSigningIn(next)
    window.scrollTo({ top: 0 })
  }

  if (signingIn) {
    return (
      <div className="relative">
        {signIn}
        <button type="button" onClick={() => go(false)} className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 bg-white/90 px-3 py-2 text-sm font-bold text-[#17150f] shadow hover:bg-white">
          <ArrowLeft className="h-4 w-4" /> Back to the offer
        </button>
      </div>
    )
  }

  return (
    <main style={{ ["--accent" as string]: accent }} className="min-h-screen bg-[#f6f4f0] pb-24 text-[#17150f]">
      <div aria-hidden className="h-1.5 bg-[var(--accent)]" />
      {sheet}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#e0dcd5] bg-white/95 px-4 py-3 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="hidden text-sm text-[#5a554d] sm:block">Like what you see? Sign in to open your full offer.</p>
          <button type="button" onClick={() => go(true)} className="inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] px-6 py-3.5 text-base font-bold text-white hover:opacity-90 sm:w-auto">
            I&apos;m interested <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  )
}
