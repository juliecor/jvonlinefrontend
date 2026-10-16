"use client"

import { useEffect, useRef } from "react"

/**
 * Keeps a chat on its newest line while the answer grows (text streaming in, cards appearing, photos and
 * maps loading), unless the person scrolled up to read: scrolling back down picks it up again. Put `ref`
 * on the scrolling box; `follow()` goes to the bottom and keeps following (after asking something).
 */
export function useFollow<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const stuck = useRef(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const bottom = () => {
      if (stuck.current) el.scrollTop = el.scrollHeight
    }
    // At the bottom (give or take a line) means keep following; scrolled up means leave it be.
    const onScroll = () => {
      stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    }
    // Whatever grows inside, by any amount, keeps the newest line in view.
    const grows = new ResizeObserver(bottom)
    const watch = () => {
      grows.disconnect()
      for (const child of Array.from(el.children)) grows.observe(child)
    }
    // The welcome screen gives way to the conversation, and new messages come in: watch those too.
    const changes = new MutationObserver(watch)
    watch()
    changes.observe(el, { childList: true })
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      grows.disconnect()
      changes.disconnect()
    }
  }, [])

  const follow = () => {
    stuck.current = true
    requestAnimationFrame(() => {
      const el = ref.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  return { ref, follow }
}
