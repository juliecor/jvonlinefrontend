import { JohndorfShell, johndorfMetadata } from "../johndorf/shell"

export const metadata = johndorfMetadata

/** /projects and /projects/<slug> in Johndorf's look. */
export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <JohndorfShell>{children}</JohndorfShell>
}
