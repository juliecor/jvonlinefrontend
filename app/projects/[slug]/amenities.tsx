import { Building2, Check, CircleDot, Container, DoorOpen, Droplets, Fence, Flame, Footprints, Lamp, type LucideIcon, Route, ShieldCheck, Store, Sun, Trees, Waves, Zap } from "lucide-react"
import { Reveal } from "../../johndorf/home/ui"

/** Pick an icon from the amenity's own words. */
function iconFor(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (/pool/.test(n)) return Waves
  if (/clubhouse|hall|multi/.test(n)) return Building2
  if (/gate|guard/.test(n)) return DoorOpen
  if (/security/.test(n)) return ShieldCheck
  if (/park|playground|garden|landscap/.test(n)) return Trees
  if (/basketball|court/.test(n)) return CircleDot
  if (/road|rrow|entrance/.test(n)) return Route
  if (/drain|sewage|sewer|lagoon|treatment/.test(n)) return Droplets
  if (/water|cistern|tank/.test(n)) return Container
  if (/power|electric|cepalco|meco|veco|davao light/.test(n)) return Zap
  if (/fence|perimeter/.test(n)) return Fence
  if (/jog|trail|walk/.test(n)) return Footprints
  if (/retail|commercial|store/.test(n)) return Store
  if (/light/.test(n)) return Lamp
  if (/open space|space/.test(n)) return Sun
  if (/fire/.test(n)) return Flame
  return Check
}

export function Amenities({ items, project }: { items: string[]; project: string }) {
  const fill = (4 - (items.length % 4)) % 4
  const span = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3" }[fill]
  return (
    <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((a, n) => {
        const Icon = iconFor(a)
        return (
          <Reveal key={a} delay={(n % 4) * 0.05}>
            <li className="flex h-full items-start gap-4 border border-[#2a1d1b]/10 bg-white p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-[#b4241c] text-white">
                <Icon className="h-5 w-5" />
              </span>
              <p className="pt-2 text-[15px] font-medium leading-snug text-[#2a1d1b]">{a}</p>
            </li>
          </Reveal>
        )
      })}
      {fill > 0 && (
        <li className={`hidden items-center bg-[#2a1d1b] p-5 text-white lg:flex ${span}`}>
          <p className="text-sm leading-snug text-white/80">
            <span className="font-semibold text-white">{items.length} amenities and facilities</span> at {project}, as listed on Johndorf&apos;s project page.
          </p>
        </li>
      )}
    </ul>
  )
}
