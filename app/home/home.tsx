"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, ArrowUpRight, Building2, LogIn, Send, UserPlus } from "lucide-react"
import { PhMap } from "./ph-map"

export type PublicRealty = { id: number; name: string; slug: string; logo_path: string | null; registered_at: string | null }

const ease = [0.22, 1, 0.36, 1] as const
const serif = "font-[family-name:var(--font-jv-serif)]"

const STEPS = [
  { icon: Building2, title: "A realty is invited", body: "jvconline sets up the realty's address and sends a registration form. The realty fills in who they are and gets its own page." },
  { icon: UserPlus, title: "The realty brings its team", body: "From its own dashboard, each realty signs in with its own branding and invites its agents." },
  { icon: Send, title: "Agents send buyers an offer", body: "An agent picks a unit and sends the buyer a link: the property, the payment plan and the floor plan, on one clean page." },
]

export function Home({ realties }: { realties: PublicRealty[] }) {
  const reduce = useReducedMotion()
  const rise = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease },
  })

  return (
    <div className="min-h-screen bg-[#05070d] text-white selection:bg-[#38bdf8]/30">
      {/* ─── Header ─── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#05070d]/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/platform" className="flex items-baseline gap-0.5 text-lg font-semibold tracking-tight">
            jvconline<span className="text-[#7dd3fc]">.ph</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#realties" className="transition hover:text-white">Realties</a>
            <a href="#how" className="transition hover:text-white">How it works</a>
          </nav>
          <Link href="/admin/login" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur transition hover:border-white/40 hover:bg-white/10">
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        </div>
      </header>

      {/* ─── Hero: the whole country behind the words ─── */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-60 left-1/3 h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[#38bdf8]/10 blur-[180px]" />
        <motion.div
          aria-hidden
          initial={reduce ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease }}
          className="pointer-events-none absolute inset-y-0 right-0 flex w-full items-center justify-center lg:w-[62%] lg:justify-end lg:pr-[4vw]"
        >
          <PhMap className="h-[88vh] w-full opacity-45 drop-shadow-[0_0_40px_rgba(56,189,248,0.25)] sm:opacity-60 lg:h-[94vh] lg:w-auto lg:max-w-none lg:opacity-100" />
        </motion.div>
        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 pb-24 pt-36 sm:px-8 lg:pb-28 lg:pt-40">
          <div className="max-w-2xl">
            <motion.p {...rise(0.1)} className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7dd3fc]">
              Realties of the Philippines
            </motion.p>
            <motion.h1 {...rise(0.2)} className={`${serif} mt-6 text-[clamp(3.2rem,9.5vw,7.5rem)] leading-[0.92] tracking-tight`}>
              Every realty,
              <br />
              <span className="italic text-[#bae6fd]">online.</span>
            </motion.h1>
            <motion.p {...rise(0.35)} className="mt-8 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              jvconline gives realty companies their own page and their own dashboard, and gives their agents a simple way to send buyers a sales offer.
            </motion.p>
            <motion.div {...rise(0.5)} className="mt-10 flex flex-wrap gap-3">
              <a href="#realties" className="group inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#05070d] transition hover:bg-[#dbeafe]">
                See the realties <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <Link href="/admin/login" className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10">
                Sign in
              </Link>
            </motion.div>
          </div>
        </div>
        <motion.a
          href="#realties"
          aria-label="Scroll down"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="absolute bottom-8 left-5 z-10 hidden items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40 sm:left-8 sm:flex"
        >
          <span className="h-px w-10 bg-white/30" /> Scroll
        </motion.a>
      </section>

      {/* ─── Realties ─── */}
      <section id="realties" className="border-t border-white/10 scroll-mt-20">
        <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7dd3fc]">On jvconline</p>
              <h2 className={`${serif} mt-3 text-4xl tracking-tight sm:text-5xl`}>The realties</h2>
            </div>
            <p className="max-w-sm text-sm text-white/55">Each one has its own page here, built for it.</p>
          </div>

          {realties.length > 0 ? (
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {realties.map((r, i) => (
                <motion.li
                  key={r.id}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease }}
                >
                  <Link href={`/${r.slug}`} className="group flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-[#7dd3fc]/50 hover:bg-white/[0.06]">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">jvconline.ph/{r.slug}</p>
                      <p className={`${serif} mt-4 text-3xl leading-tight`}>{r.name}</p>
                    </div>
                    <span className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-[#7dd3fc]">
                      Visit the page <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="mt-12 rounded-3xl border border-dashed border-white/15 p-10 text-center text-sm text-white/55">The first realties are being set up.</p>
          )}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="border-t border-white/10 bg-white/[0.02] scroll-mt-20">
        <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7dd3fc]">How it works</p>
          <h2 className={`${serif} mt-3 max-w-2xl text-4xl tracking-tight sm:text-5xl`}>Three levels, one platform.</h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <motion.li
                key={title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease }}
                className="relative"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#7dd3fc]/40 text-[#7dd3fc]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`${serif} text-2xl text-white/35`}>0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-10 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            <span className="font-semibold text-white/80">jvconline</span>
            <span className="text-[#7dd3fc]">.ph</span> · © {new Date().getFullYear()}
          </p>
          <div className="flex gap-6">
            <a href="#realties" className="transition hover:text-white">Realties</a>
            <a href="#how" className="transition hover:text-white">How it works</a>
            <Link href="/admin/login" className="transition hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
