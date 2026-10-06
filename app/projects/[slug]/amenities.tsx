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

export function Amenities({ items }: { items: string[] }) {
  return (
    <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((a, n) => {
        const Icon = iconFor(a)
        return (
          <Reveal key={a} delay={(n % 4) * 0.05}>
            <li className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#b4241c]/25 bg-white text-[#b4241c]">
                <Icon className="h-5 w-5" />
              </span>
              <p className="pt-2.5 text-[15px] font-medium leading-snug text-[#2a1d1b]">{a}</p>
            </li>
          </Reveal>
        )
      })}
    </ul>
  )
}
