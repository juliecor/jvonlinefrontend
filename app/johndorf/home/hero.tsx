"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from "framer-motion"
import { ArrowRight, ChevronDown, MapPin } from "lucide-react"
import { CITIES, COMPANY, HERO_SLIDES } from "@/lib/johndorf/company"
import { INK, Magnetic, ease, serif } from "./ui"

/** Where the giant word sits, and the point inside a letter stroke the camera flies into. */
type Stage = { w: number; h: number; fs: number; lines: string[]; baselines: number[]; family: string; tx: number; ty: number }

function layoutWord(w: number, h: number, family: string): Stage {
  const lines = w / h < 0.85 ? ["JOHN", "DORF"] : ["JOHNDORF"]
  const ctx = document.createElement("canvas").getContext("2d")!
  ctx.font = `800 100px ${family}`
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
  const fs = Math.min(((w * (lines.length > 1 ? 0.84 : 0.9)) / widest) * 100, h * (lines.length > 1 ? 0.28 : 0.4))
  const lh = fs * 0.9
  const first = h / 2 - (lh * lines.length) / 2 + fs * 0.72
  const baselines = lines.map((_, i) => first + i * lh)

  // Draw the word small and find the ink pixel deepest inside a stroke near the centre.
  const k = 0.25
  const cw = Math.max(1, Math.round(w * k))
  const ch = Math.max(1, Math.round(h * k))
  const c = document.createElement("canvas")
  c.width = cw
  c.height = ch
  const g = c.getContext("2d")!
  g.scale(k, k)
  g.font = `800 ${fs}px ${family}`
  g.textAlign = "center"
  lines.forEach((l, i) => g.fillText(l, w / 2, baselines[i]))
  const data = g.getImageData(0, 0, cw, ch).data
  const ink = (x: number, y: number) => x >= 0 && y >= 0 && x < cw && y < ch && data[(y * cw + x) * 4 + 3] > 128
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  let best = { x: w / 2, y: h / 2, score: -Infinity }
  for (let y = Math.floor(ch * 0.2); y < ch * 0.8; y++) {
    for (let x = Math.floor(cw * 0.25); x < cw * 0.75; x++) {
      if (!ink(x, y)) continue
      let depth = Infinity
      for (const [dx, dy] of dirs) {
        let s = 1
        while (s < 60 && ink(x + dx * s, y + dy * s)) s++
        depth = Math.min(depth, s)
      }
      const score = depth - Math.hypot(x - cw / 2, y - ch / 2) * 0.05
      if (score > best.score) best = { x: x / k, y: y / k, score }
    }
  }
  return { w, h, fs, lines, baselines, family, tx: best.x, ty: best.y }
}

/**
 * The opening is one gesture, not a scrubbed scroll. A single scroll (wheel tick, swipe, key or click on
 * "Scroll to enter") plays the whole move by itself and lands on the headline; the page is then one screen
 * tall and scrolls normally. Scrolling up once at the very top brings the big word back: not the zoom
 * run backwards (giant letters sweeping past in a blink read as flicker) but a dip to the dark and the
 * word fading up out of it.
 *
 *   intro → entering → entered → leaving → intro
 */
type Phase = "intro" | "entering" | "entered" | "leaving"

/** The move runs from 0 (the word) to LANDED (the headline). */
const LANDED = 1
const ENTER_SECONDS = 2.6
/** Way back: the hero dims into the dark, resets out of sight, and the word rises out of it. */
const DIM_SECONDS = 0.6
const RISE_SECONDS = 1.1
/** A gentle start and a soft landing, with an even pace in between. */
const GLIDE = [0.4, 0, 0.3, 1] as const
/** The camera is inside the letter by here; the rest of the move is the headline settling in. */
const ZOOM_UNTIL = 0.72

/**
 * The camera dollies into the word at a steady pace: scale 1 → 80, with the exponent moving evenly. The eye
 * reads an exponential zoom as even speed, so the letters sweep past smoothly, forwards and backwards.
 * (Squaring the exponent made the last stretch race: that is what looked like a flicker on the way back.)
 */
function zoomTransform(stage: Stage, progress: number, intro: number) {
  const t = Math.min(1, Math.max(0, progress / ZOOM_UNTIL))
  const s = Math.pow(80, t) * intro
  return `translate(${stage.tx} ${stage.ty}) scale(${s}) translate(${-stage.tx} ${-stage.ty})`
}

export function Hero({ ready }: { ready: boolean }) {
  const reduce = useReducedMotion()
  const stageBox = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const maskG = useRef<SVGGElement>(null)
  const [stage, setStage] = useState<Stage | null>(null)
  const [slide, setSlide] = useState(0)
  const [live, setLive] = useState(false)
  const [phase, setPhase] = useState<Phase>("intro")
  const phaseNow = useRef<Phase>("intro") // what the event handlers read: state is a render behind
  const glide = useRef<ReturnType<typeof animate> | null>(null)
  const lastScrollAt = useRef(0)
  const intro = useMotionValue(1.18)
  /** 0 = the word, LANDED = the headline. Driven by time, never by scroll position. */
  const p = useMotionValue(0)
  /** A veil of the dark ink over the stage: 1 hides everything, used to switch back to the word unseen. */
  const veil = useMotionValue(0)

  // The photos change every few seconds, but only while the page is on screen. A background tab keeps its
  // timers running and pauses its animations, so the slideshow used to pile up photos that never finished
  // fading out, and they all came back at once, ghosted over each other, when you returned to the tab.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const stop = () => {
      clearInterval(timer)
      timer = undefined
    }
    const start = () => {
      if (!timer && document.visibilityState === "visible") timer = setInterval(() => setSlide((n) => (n + 1) % HERO_SLIDES.length), 5200)
    }
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop())
    start()
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  // Lay the word out for this screen (again on resize), once the serif is loaded.
  useEffect(() => {
    const el = stageBox.current
    const p = probe.current
    if (!el || !p) return
    let alive = true
    const family = getComputedStyle(p).fontFamily
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) return
      document.fonts
        .load(`800 100px ${family}`)
        .catch(() => null)
        .then(() => {
          if (alive) setStage(layoutWord(r.width, r.height, family))
        })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      alive = false
      ro.disconnect()
    }
  }, [])

  // The camera pulls back as the curtain lifts.
  useEffect(() => {
    if (!ready) return
    const a = animate(intro, 1, { duration: reduce ? 0 : 1.8, ease })
    return () => a.stop()
  }, [ready, intro, reduce])

  const go = useCallback((next: Phase) => {
    phaseNow.current = next
    setPhase(next)
  }, [])
  const run = useCallback(
    (to: number, seconds: number, during: Phase, done: Phase) => {
      glide.current?.stop()
      go(during)
      glide.current = animate(p, to, { duration: seconds, ease: GLIDE, onComplete: () => go(done) })
    },
    [p, go],
  )
  const enter = useCallback(() => {
    if (phaseNow.current === "intro") run(LANDED, ENTER_SECONDS, "entering", "entered")
  }, [run])
  const leave = useCallback(() => {
    if (phaseNow.current !== "entered") return
    glide.current?.stop()
    go("leaving")
    glide.current = animate(veil, 1, {
      duration: DIM_SECONDS,
      ease: "easeIn",
      onComplete: () => {
        p.set(0) // back to the word, behind the dark
        glide.current = animate(veil, 0, { duration: RISE_SECONDS, ease: "easeOut", onComplete: () => go("intro") })
      },
    })
  }, [go, p, veil])
  /** Straight to the headline, no move: someone who jumped down the page, or prefers no motion. */
  const skip = useCallback(() => {
    glide.current?.stop()
    veil.set(0)
    p.set(LANDED)
    go("entered")
  }, [p, veil, go])

  // Someone who asked for less motion gets the headline straight away (a frame later, off the render).
  useEffect(() => {
    if (!reduce) return
    const frame = requestAnimationFrame(skip)
    return () => cancelAnimationFrame(frame)
  }, [reduce, skip])

  // The one scroll. Until the headline has landed the page itself stays put: wheel, swipe and keys are
  // taken as "go" (and ignored while it moves). After that nothing is intercepted, except one deliberate
  // scroll up from the very top, which plays the opening again.
  useEffect(() => {
    if (!ready || reduce) return
    // Arrived part-way down (reload, back button, a link to a section): no opening to play.
    const restored = window.scrollY > 4 ? requestAnimationFrame(skip) : 0
    lastScrollAt.current = Date.now()

    // Resting at the top for a moment, so the tail of a fast scroll up doesn't replay the opening.
    const atRest = () => window.scrollY <= 1 && Date.now() - lastScrollAt.current > 600
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable='true']")
    const pressable = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("button, a, [role='button']")

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // pinch-zoom
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY
      if (phaseNow.current === "entered") {
        if (dy < -8 && atRest()) {
          e.preventDefault()
          leave()
        }
        return
      }
      e.preventDefault()
      if (dy > 4) enter()
    }

    let touchY = 0
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - (e.touches[0]?.clientY ?? touchY) // positive: a swipe up, i.e. scrolling down
      if (phaseNow.current === "entered") {
        if (dy < -40 && atRest() && e.cancelable) {
          e.preventDefault()
          leave()
        }
        return
      }
      if (e.cancelable) e.preventDefault()
      if (dy > 28) enter()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return
      const space = e.key === " " || e.key === "Spacebar"
      if (space && pressable(e.target)) return // a focused button or link uses the space bar itself
      const down = ["ArrowDown", "PageDown"].includes(e.key) || (space && !e.shiftKey)
      const up = ["ArrowUp", "PageUp"].includes(e.key) || (space && e.shiftKey)
      if (phaseNow.current === "entered") {
        if (up && atRest()) {
          e.preventDefault()
          leave()
        }
        return
      }
      if (e.key === "End") return skip() // asked for the bottom of the page: let it go there
      if (down || up || e.key === "Home") e.preventDefault()
      if (down) enter()
    }

    // Anything else that moves the page (a nav link, the scrollbar, a restored position) means they
    // are going somewhere: skip the opening instead of fighting it.
    const onScroll = () => {
      lastScrollAt.current = Date.now()
      if (phaseNow.current === "intro" && window.scrollY > 4) skip()
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("keydown", onKey)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(restored)
      glide.current?.stop()
    }
  }, [ready, reduce, enter, leave, skip])

  useEffect(() => {
    if (!stage) return
    const apply = () => {
      const tr = zoomTransform(stage, p.get(), intro.get())
      maskG.current?.setAttribute("transform", tr)
    }
    apply()
    const a = p.on("change", apply)
    const b = intro.on("change", apply)
    return () => {
      a()
      b()
    }
  }, [stage, p, intro])
  useMotionValueEvent(p, "change", (v) => setLive(v > ZOOM_UNTIL))

  // The dark layer with the word cut out of it dissolves over a long stretch of the zoom (scale ~5 to ~50). A short
  // fade there reads as a flash of black, most of all on the way back, when the letters are coming out of the photo.
  const inkOpacity = useTransform(p, [0.28, 0.66], [1, 0])
  // Once it is invisible it is not painted at all: a full-screen mask at 80x is the costliest thing on the page.
  const inkDisplay = useTransform(inkOpacity, (o) => (o <= 0.002 ? "none" : "block"))
  const photoScale = useTransform(p, [0, 0.8], [1.22, 1])
  const cueOpacity = useTransform(p, [0, 0.08], [1, 0])
  const contentOpacity = useTransform(p, [ZOOM_UNTIL, 0.88], [0, 1])
  const contentY = useTransform(p, [ZOOM_UNTIL, 0.97], [70, 0])
  const shadeOpacity = useTransform(p, [0.6, 0.85], [0, 1])

  const showMask = !reduce

  return (
    <section id="top" data-hero={phase} className="relative h-[100svh] overflow-hidden" style={{ backgroundColor: INK }}>
      <span ref={probe} aria-hidden className={`${serif} pointer-events-none absolute opacity-0`}>
        J
      </span>
      <div ref={stageBox} className="relative h-full overflow-hidden text-white">
        {/* Photos — seen through the letters first, then full screen. */}
        <motion.div style={{ scale: showMask ? photoScale : 1 }} className="absolute inset-0">
          <AnimatePresence initial={false}>
            <motion.div key={HERO_SLIDES[slide].src} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6, ease: "easeInOut" }} className="absolute inset-0">
              <Image src={HERO_SLIDES[slide].src} alt={HERO_SLIDES[slide].caption} fill priority={slide === 0} sizes="100vw" className="jd-kenburns object-cover" />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Legibility shade for the headline once the screen is all photo. */}
        <motion.div style={{ opacity: showMask ? shadeOpacity : 1 }} className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_70%,rgba(22,12,10,0.2),rgba(22,12,10,0.85))]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#160c0a] via-[#160c0a]/45 to-[#160c0a]/55" />
        </motion.div>

        {/* The word: ink everywhere except the letters, which are windows onto the photos. */}
        {showMask && stage && (
          <motion.svg style={{ opacity: inkOpacity, display: inkDisplay }} width={stage.w} height={stage.h} viewBox={`0 0 ${stage.w} ${stage.h}`} className="pointer-events-none absolute inset-0" aria-hidden>
            <defs>
              <mask id="jd-hero-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={stage.w} height={stage.h}>
                <rect width={stage.w} height={stage.h} fill="white" />
                <g ref={maskG}>
                  {stage.lines.map((l, i) => (
                    <text key={l} x={stage.w / 2} y={stage.baselines[i]} textAnchor="middle" fontSize={stage.fs} fontWeight={800} fontFamily={stage.family} fill="black">
                      {l}
                    </text>
                  ))}
                </g>
              </mask>
            </defs>
            <rect width={stage.w} height={stage.h} fill={INK} mask="url(#jd-hero-mask)" />
          </motion.svg>
        )}
        {showMask && !stage && <div className="absolute inset-0" style={{ backgroundColor: INK }} />}

        {/* Opening lines around the word. */}
        {showMask && (
          <motion.div style={{ opacity: cueOpacity }} className="pointer-events-none absolute inset-0">
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={ready ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.6, duration: 0.9, ease }}
              className="absolute inset-x-0 top-[16%] text-center text-[10px] font-semibold uppercase tracking-[0.42em] text-white/70 sm:top-[22%] sm:text-[11px]"
            >
              {COMPANY.name} · Since {COMPANY.founded}
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 1.2, duration: 0.9 }} className="absolute inset-x-0 bottom-[9%] flex justify-center">
              <button
                type="button"
                onClick={enter}
                disabled={phase !== "intro"}
                data-cursor="Enter"
                className={`flex flex-col items-center gap-2 px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.36em] text-white/65 transition-colors hover:text-white ${phase === "intro" ? "pointer-events-auto" : "pointer-events-none"}`}
              >
                Scroll to enter
                <motion.span animate={{ y: [0, 7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* What the camera lands on. */}
        <HeroContent opacity={showMask ? contentOpacity : null} y={showMask ? contentY : null} live={live || !showMask} slide={slide} setSlide={setSlide} />

        {/* The dark ink, drawn over everything while the stage switches back to the word. */}
        {showMask && <motion.div aria-hidden style={{ opacity: veil, backgroundColor: INK }} className="pointer-events-none absolute inset-0" />}
      </div>
    </section>
  )
}

function HeroContent({ opacity, y, live, slide, setSlide }: { opacity: MotionValue<number> | null; y: MotionValue<number> | null; live: boolean; slide: number; setSlide: (n: number) => void }) {
  return (
    <motion.div inert={!live} style={{ opacity: opacity ?? 1, y: y ?? 0 }} className={`absolute inset-0 ${live ? "" : "pointer-events-none"}`}>
      <div className="mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-8 sm:px-8 sm:pb-12">
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#f0b6b1]">
          <span className="h-px w-10 bg-[#f0b6b1]/70" />
          {COMPANY.name}
        </p>
        <h1 className={`${serif} mt-4 text-[68px] font-semibold leading-[0.92] tracking-tight sm:text-[120px] lg:text-[164px]`}>
          {["Always", "there."].map((w, n) => (
            <span key={w} className="-mb-[0.16em] mr-[0.2em] inline-block overflow-hidden pb-[0.16em] align-bottom">
              <motion.span className={`inline-block ${n === 1 ? "italic text-[#f0b6b1]" : ""}`} initial={false} animate={{ y: live ? "0%" : "105%" }} transition={{ duration: 1.1, delay: n * 0.12, ease }}>
                {w}
              </motion.span>
            </span>
          ))}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
          Homes and communities for every Filipino family — across {CITIES.slice(0, -1).join(", ")} and {CITIES.at(-1)}.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Magnetic>
            <Link
              href="/johndorf/montierra"
              data-cursor="Open"
              className="group inline-flex items-center gap-2.5 rounded-full bg-[#b4241c] px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_-14px_rgba(180,36,28,0.9)] transition-colors hover:bg-[#941414]"
            >
              Explore Montierra <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Magnetic>
          <Magnetic>
            <a href="#story" className="inline-flex items-center gap-2.5 rounded-full border border-white/35 bg-white/5 px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur transition-colors hover:bg-white/15">
              Our story
            </a>
          </Magnetic>
        </div>
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/15 pt-5 text-xs text-white/60">
          <AnimatePresence mode="wait">
            <motion.span key={HERO_SLIDES[slide].caption} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4 }} className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> {HERO_SLIDES[slide].caption}
            </motion.span>
          </AnimatePresence>
          <div className="flex gap-1.5">
            {HERO_SLIDES.map((s, n) => (
              <button key={s.src} type="button" aria-label={`Show ${s.caption}`} onClick={() => setSlide(n)} className={`h-1.5 rounded-full transition-all duration-500 ${n === slide ? "w-8 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
