import { JohndorfShell, johndorfMetadata } from "./shell"

export const metadata = johndorfMetadata

/** Everything under /johndorf (Montierra map, Johndorf's login and dashboard) in Johndorf's look. The landing itself is at /. */
export default function JohndorfLayout({ children }: { children: React.ReactNode }) {
  return <JohndorfShell>{children}</JohndorfShell>
}
