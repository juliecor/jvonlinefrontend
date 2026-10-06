import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, ArrowUpRight, ExternalLink, MapPin } from "lucide-react"
import { PROJECTS } from "@/lib/johndorf/company"
import { SITE_PROJECTS } from "@/lib/johndorf/site-projects"
import { Eyebrow, Reveal } from "../../johndorf/home/ui"
import { serif } from "../../johndorf/tokens"
import { SiteHeader } from "../header"
import { Amenities } from "./amenities"
import { SectionHead } from "./section-head"
import { ProjectHero } from "./hero"
import { SitePlan } from "./site-plan"
import { UnitTypes } from "./unit-types"
import { Updates } from "./updates"

type Props = { params: Promise<{ slug: string }> }

const listed = PROJECTS.filter((p) => p.slug && SITE_PROJECTS[p.slug])

export function generateStaticParams() {
  return listed.map((p) => ({ slug: p.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const meta = listed.find((p) => p.slug === slug)
  const site = SITE_PROJECTS[slug]
  if (!meta || !site) return {}
  const description = `${meta.name} by Johndorf Ventures Corporation in ${meta.place}: ${site.unitTypes.map((u) => u.name).join(", ")}, ${site.amenities.length} amenities${site.updates.length ? `, construction updates since ${site.updates[0].label}` : ""}.`
  const image = site.hero[0] ?? meta.image
  return {
    title: meta.name,
    description,
    openGraph: { title: `${meta.name} · Johndorf Ventures Corporation`, description, images: [{ url: image }] },
    twitter: { card: "summary_large_image", title: `${meta.name} · Johndorf`, description, images: [image] },
  }
}

/** jvconline.ph/projects/<slug> — one Johndorf project, everything their own page says, set properly. */
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const idx = listed.findIndex((p) => p.slug === slug)
  const meta = listed[idx]
  const site = SITE_PROJECTS[slug]
  if (!meta || !site) notFound()
  const prev = listed[(idx - 1 + listed.length) % listed.length]
  const next = listed[(idx + 1) % listed.length]
  const hero = site.hero.length ? site.hero : [meta.image]
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const spot = site.map ? `${site.map.lat},${site.map.lng}` : site.mapQuery ?? `${meta.name}, ${meta.place}, Philippines`
  const mapOpen = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot)}`
  const mapImg = key ? `https://maps.googleapis.com/maps/api/staticmap?size=640x400&scale=2&zoom=${site.map ? 15 : 13}&maptype=roadmap&markers=color:0xb4241c%7C${encodeURIComponent(spot)}&key=${key}` : null
  const totalPhotos = site.updates.reduce((n, m) => n + m.photos.length, 0)

  const sections = [
    ...(site.sitePlans.length ? [{ href: "#site-plan", label: "Site plan" }] : []),
    ...(site.amenities.length ? [{ href: "#amenities", label: "Amenities" }] : []),
    { href: "#location", label: "Location" },
    ...(site.updates.length ? [{ href: "#updates", label: "Updates" }] : []),
  ]

  const facts = [
    { v: String(site.unitTypes.length), l: site.unitTypes.length === 1 ? "Unit type" : "Unit types" },
    { v: String(site.amenities.length), l: "Amenities & facilities" },
    ...(site.updates.length ? [{ v: String(site.updates.length), l: "Months of updates" }, { v: String(totalPhotos), l: "Progress photos" }] : []),
    { v: meta.region, l: "Region" },
  ]

  return (
    <div className="bg-[#fbf8f6] text-[#2a1d1b]">
      <SiteHeader light />
      <ProjectHero name={meta.name} place={meta.place} status={meta.status} photos={hero} interactive={meta.interactive} />

      {/* Facts */}
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

      {/* Homes */}
      <section id="homes" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHead eyebrow="The homes" lede="Johndorf's own spec sheet for each model: usable floor area, bedrooms, toilet and bath, floors and parking. Tap a render to see it full screen.">
            {site.unitTypes.length === 1 ? "One model, " : `${site.unitTypes.length} models, `}
            <span className="italic text-[#b4241c]">built the Johndorf way.</span>
          </SectionHead>
          <UnitTypes units={site.unitTypes} sections={sections} />
        </div>
      </section>

      {/* Site plan */}
      {site.sitePlans.length > 0 && (
        <section id="site-plan" className="scroll-mt-20 bg-[#f3ece9] px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1400px]">
            <SectionHead
              eyebrow="Site development plan"
              lede="Blocks, lots, roads, parks and open spaces as drawn by Johndorf's planners. Tap to view full screen."
              action={
                meta.interactive ? (
                  <Link href="/johndorf/montierra" className="inline-flex items-center gap-2 rounded-sm bg-[#b4241c] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#941414]">
                    Open the interactive plan <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : undefined
              }
            >
              The lay of the land.
            </SectionHead>
            <SitePlan plans={site.sitePlans} name={meta.name} />
          </div>
        </section>
      )}

      {/* Amenities */}
      {site.amenities.length > 0 && (
        <section id="amenities" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1400px]">
            <SectionHead eyebrow="Amenities & facilities" lede={`${site.amenities.length} amenities and facilities, as listed on Johndorf's page for ${meta.name}.`}>
              Everything a community needs.
            </SectionHead>
            <Amenities items={site.amenities} project={meta.name} />
          </div>
        </section>
      )}

      {/* Location */}
      <section id="location" className="scroll-mt-20 bg-[#160c0a] px-5 py-24 text-white sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <Reveal>
            <Eyebrow light>Location</Eyebrow>
            <h2 className={`${serif} mt-4 text-4xl font-semibold tracking-tight sm:text-6xl`}>{meta.place}.</h2>
            <p className="mt-5 max-w-md text-white/70">
              {meta.region === "Cagayan de Oro" ? "In Northern Mindanao's gateway city, where Johndorf has built since its early years." : meta.region === "Cebu" ? "In Cebu, where Johndorf is one of the region's leading home builders." : meta.region === "Davao" ? "In Davao, one of Mindanao's most progressive cities." : "In Iligan, where Johndorf began in 1986."}
            </p>
            <a href={mapOpen} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-sm border border-white/30 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-white/10">
              <MapPin className="h-4 w-4" /> Open in Google Maps <ArrowUpRight className="h-4 w-4" />
            </a>
          </Reveal>
          <Reveal delay={0.1}>
            {mapImg ? (
              <a href={mapOpen} target="_blank" rel="noreferrer" className="block overflow-hidden border border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mapImg} alt={`Map of ${meta.name}`} width={640} height={400} className="aspect-[16/10] w-full object-cover" />
              </a>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center rounded-none border border-white/10 text-sm text-white/50">Map unavailable</div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Updates */}
      {site.updates.length > 0 && (
        <section id="updates" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1400px]">
            <SectionHead eyebrow="Construction updates" lede={`${totalPhotos} photos from Johndorf's site team, ${site.updates[0].label} to ${site.updates[site.updates.length - 1].label}. Newest month first.`}>
              Watch it rise, <span className="italic text-[#b4241c]">month by month.</span>
            </SectionHead>
            <Updates months={site.updates} />
          </div>
        </section>
      )}

      {/* Inquire + next */}
      <section className="border-t border-[#2a1d1b]/10 bg-white px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
              <div>
                <Eyebrow>Interested?</Eyebrow>
                <h2 className={`${serif} mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl`}>Ask about {meta.name}.</h2>
                <p className="mt-5 max-w-lg text-[#6b5a56]">Reserve through Johndorf&apos;s official page, or sign in if you&apos;re a Johndorf agent to prepare a sales offer for your buyer.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={site.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-sm bg-[#b4241c] px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#941414]">
                    Inquire on johndorfventures.com <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link href="/johndorf/login" className="inline-flex items-center gap-2 rounded-sm border border-[#2a1d1b]/20 px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#2a1d1b] hover:border-[#b4241c] hover:text-[#b4241c]">
                    Agent sign in
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[prev, next].map((p, n) => (
                  <Link key={p.slug} href={`/projects/${p.slug}`} className="group relative overflow-hidden bg-[#160c0a] text-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={SITE_PROJECTS[p.slug!]?.hero[0] ?? p.image} alt="" className="aspect-[4/5] w-full object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-85" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{n === 0 ? "Previous" : "Next"}</p>
                      <p className={`${serif} mt-1 text-2xl font-semibold leading-tight`}>{p.name}</p>
                      <p className="mt-1 text-xs text-white/70">{p.place}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
          <p className="mt-16 text-[11px] text-[#a8968f]">Details, renders and photos from Johndorf&apos;s project page, read October 2025. Specifications and availability may change.</p>
        </div>
      </section>
    </div>
  )
}
