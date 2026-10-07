import type { Metadata } from "next"
import Link from "next/link"
import { AccountLink } from "@/components/account-link"
import { notFound } from "next/navigation"
import { ArrowRight, ArrowUpRight, ExternalLink, MapPin } from "lucide-react"
import { publicProject, publicProjects } from "@/lib/public-projects"
import { Eyebrow, Reveal } from "../../johndorf/home/ui"
import { serif } from "../../johndorf/tokens"
import { SiteHeader } from "../header"
import { Amenities } from "./amenities"
import { ProjectHero } from "./hero"
import { SectionHead } from "./section-head"
import { SitePlan } from "./site-plan"
import { UnitTypes } from "./unit-types"
import { Updates } from "./updates"

type Props = { params: Promise<{ slug: string }> }

const REGION_LINE: Record<string, string> = {
  "Cagayan de Oro": "In Northern Mindanao's gateway city, where Johndorf has built since its early years.",
  Cebu: "In Cebu, where Johndorf is one of the region's leading home builders.",
  Davao: "In Davao, one of Mindanao's most progressive cities.",
  Iligan: "In Iligan, where Johndorf began in 1986.",
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await publicProject(slug)
  if (!p) return {}
  const description = `${p.name} by Johndorf Ventures Corporation in ${p.location ?? "the Philippines"}: ${p.unit_types.map((u) => u.name).join(", ")}, ${p.amenities.length} amenities${p.updates.length ? `, construction updates since ${p.updates[0].label}` : ""}.`
  const image = p.hero[0] ?? p.cover_url ?? undefined
  return {
    title: p.name,
    description,
    openGraph: { title: `${p.name} · Johndorf Ventures Corporation`, description, images: image ? [{ url: image }] : [] },
    twitter: { card: "summary_large_image", title: `${p.name} · Johndorf`, description, images: image ? [image] : [] },
  }
}

/** jvconline.ph/projects/<slug> — one Johndorf project, from the realty's own dashboard. */
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const [p, all] = await Promise.all([publicProject(slug), publicProjects()])
  if (!p) notFound()
  const idx = all.findIndex((x) => x.slug === slug)
  const prev = all.length > 1 ? all[(idx - 1 + all.length) % all.length] : null
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null
  const hero = p.hero.length ? p.hero : p.cover_url ? [p.cover_url] : []
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasPin = p.lat !== null && p.lng !== null
  const spot = hasPin ? `${p.lat},${p.lng}` : [p.name, p.location, "Philippines"].filter(Boolean).join(", ")
  const mapOpen = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot)}`
  const mapImg = key ? `https://maps.googleapis.com/maps/api/staticmap?size=640x400&scale=2&zoom=${hasPin ? 15 : 13}&maptype=roadmap&markers=color:0xb4241c%7C${encodeURIComponent(spot)}&key=${key}` : null
  const interactive = slug === "montierra"

  const sections = [
    ...(p.site_plans.length ? [{ href: "#site-plan", label: "Site plan" }] : []),
    ...(p.amenities.length ? [{ href: "#amenities", label: "Amenities" }] : []),
    { href: "#location", label: "Location" },
    ...(p.updates.length ? [{ href: "#updates", label: "Updates" }] : []),
  ]
  const facts = [
    { v: String(p.unit_types.length), l: p.unit_types.length === 1 ? "Unit type" : "Unit types" },
    { v: String(p.amenities.length), l: "Amenities & facilities" },
    ...(p.updates.length ? [{ v: String(p.updates.length), l: "Months of updates" }, { v: String(p.total_photos), l: "Progress photos" }] : []),
    ...(p.region ? [{ v: p.region, l: "Region" }] : []),
  ]

  return (
    <div className="bg-[#fbf8f6] text-[#2a1d1b]">
      <SiteHeader light />
      <ProjectHero name={p.name} place={p.location ?? ""} status={p.stage ?? undefined} photos={hero} interactive={interactive} />

      <section className="border-b border-[#2a1d1b]/10 bg-white">
        <dl className="mx-auto grid max-w-[1400px] grid-cols-2 divide-[#2a1d1b]/10 px-5 sm:grid-cols-3 sm:divide-x sm:px-8 lg:grid-cols-5">
          {facts.map((f) => (
            <div key={f.l} className="py-7 sm:px-6 sm:first:pl-0">
              <dd className={`${serif} text-3xl font-semibold tracking-tight sm:text-4xl`}>{f.v}</dd>
              <dt className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8968f]">{f.l}</dt>
            </div>
          ))}
        </dl>
      </section>

      {p.unit_types.length > 0 && (
        <section id="homes" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1400px]">
            <SectionHead eyebrow="The homes" lede="Johndorf's own spec sheet for each model: usable floor area, bedrooms, toilet and bath, floors and parking. Tap a render to see it full screen.">
              {p.unit_types.length === 1 ? "One model, " : `${p.unit_types.length} models, `}
              <span className="italic text-[#b4241c]">built the Johndorf way.</span>
            </SectionHead>
            <UnitTypes units={p.unit_types} sections={sections} />
          </div>
        </section>
      )}

      {p.description && (
        <section className="px-5 pb-24 sm:px-8">
          <div className="mx-auto max-w-[1400px] border-t border-[#2a1d1b]/10 pt-10 lg:grid lg:grid-cols-[1fr_2fr] lg:gap-12">
            <Eyebrow>About {p.name}</Eyebrow>
            <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-[#4b3b37] lg:mt-0">{p.description}</p>
          </div>
        </section>
      )}

      {p.site_plans.length > 0 && (
        <section id="site-plan" className="scroll-mt-20 bg-[#f3ece9] px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1400px]">
            <SectionHead
              eyebrow="Site development plan"
              lede="Blocks, lots, roads, parks and open spaces as drawn by Johndorf's planners. Tap to view full screen."
              action={
                interactive ? (
                  <Link href="/johndorf/montierra" className="inline-flex items-center gap-2 rounded-sm bg-[#b4241c] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#941414]">
                    Open the interactive plan <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : undefined
              }
            >
              The lay of the land.
            </SectionHead>
            <SitePlan plans={p.site_plans} name={p.name} />
          </div>
        </section>
      )}

      {p.amenities.length > 0 && (
        <section id="amenities" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1400px]">
            <SectionHead eyebrow="Amenities & facilities" lede={`${p.amenities.length} amenities and facilities, as listed by Johndorf for ${p.name}.`}>
              Everything a community needs.
            </SectionHead>
            <Amenities items={p.amenities} project={p.name} />
          </div>
        </section>
      )}

      <section id="location" className="scroll-mt-20 bg-[#160c0a] px-5 py-24 text-white sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <Reveal>
            <Eyebrow light>Location</Eyebrow>
            <h2 className={`${serif} mt-4 text-4xl font-semibold tracking-tight sm:text-6xl`}>{p.location ?? p.name}.</h2>
            <p className="mt-5 max-w-md text-white/70">{(p.region && REGION_LINE[p.region]) ?? "Part of Johndorf's communities across Visayas and Mindanao."}</p>
            <a href={mapOpen} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-sm border border-white/30 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-white/10">
              <MapPin className="h-4 w-4" /> Open in Google Maps <ArrowUpRight className="h-4 w-4" />
            </a>
          </Reveal>
          <Reveal delay={0.1}>
            {mapImg ? (
              <a href={mapOpen} target="_blank" rel="noreferrer" className="block overflow-hidden border border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mapImg} alt={`Map of ${p.name}`} width={640} height={400} className="aspect-[16/10] w-full object-cover" />
              </a>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center border border-white/10 text-sm text-white/50">Map unavailable</div>
            )}
          </Reveal>
        </div>
      </section>

      {p.updates.length > 0 && (
        <section id="updates" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1400px]">
            <SectionHead eyebrow="Construction updates" lede={`${p.total_photos} photos from Johndorf's site team, ${p.updates[0].label} to ${p.updates[p.updates.length - 1].label}. Newest month first.`}>
              Watch it rise, <span className="italic text-[#b4241c]">month by month.</span>
            </SectionHead>
            <Updates months={p.updates} />
          </div>
        </section>
      )}

      <section className="border-t border-[#2a1d1b]/10 bg-white px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
              <div>
                <Eyebrow>Interested?</Eyebrow>
                <h2 className={`${serif} mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl`}>Ask about {p.name}.</h2>
                <p className="mt-5 max-w-lg text-[#6b5a56]">Reserve through Johndorf&apos;s official page, or sign in if you&apos;re a Johndorf agent to prepare a sales offer for your buyer.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {p.official_url && (
                    <a href={p.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-sm bg-[#b4241c] px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#941414]">
                      Inquire on johndorfventures.com <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <AccountLink signIn="Agent sign in" dashboard="Open your dashboard" icon={false} className="inline-flex items-center gap-2 rounded-sm border border-[#2a1d1b]/20 px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#2a1d1b] hover:border-[#b4241c] hover:text-[#b4241c]" />
                </div>
              </div>
              {prev && next && (
                <div className="grid grid-cols-2 gap-6">
                  {[prev, next].map((q, n) => (
                    <Link key={q.slug} href={`/projects/${q.slug}`} className="group relative overflow-hidden bg-[#160c0a] text-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.hero[0]} alt="" className="aspect-[4/5] w-full object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-85" />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{n === 0 ? "Previous" : "Next"}</p>
                        <p className={`${serif} mt-1 text-2xl font-semibold leading-tight`}>{q.name}</p>
                        <p className="mt-1 text-xs text-white/70">{q.location}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
          <p className="mt-16 text-[11px] text-[#a8968f]">Details, renders and photos published by Johndorf Ventures Corporation. Specifications and availability may change.</p>
        </div>
      </section>
    </div>
  )
}
