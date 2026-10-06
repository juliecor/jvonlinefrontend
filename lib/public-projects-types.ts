/** Shapes of Johndorf's public project pages as the API returns them. Safe to import from client components. */

export type PublicProjectCard = {
  slug: string
  name: string
  location: string | null
  region: string | null
  stage: string | null
  hero: string[]
  unit_types: string[]
  amenities_count: number
  total_photos: number
}

export type PublicSpecs = { usable_floor_area: string | null; typical_floor_area: string | null; bedrooms: string | null; baths: string | null; floors: string | null; parking: string | null }
export type PublicUnitType = { id: number; name: string; specs: PublicSpecs | null; images: string[] }
export type PublicUpdate = { id: number; month: string; label: string; photos: string[] }
export type PublicProject = {
  id: number
  slug: string
  name: string
  location: string | null
  region: string | null
  stage: string | null
  lat: number | null
  lng: number | null
  description: string | null
  cover_url: string | null
  hero: string[]
  site_plans: string[]
  amenities: string[]
  official_url: string | null
  completion_date: string | null
  unit_types: PublicUnitType[]
  updates: PublicUpdate[]
  total_photos: number
}

export const SPEC_LABELS: Record<keyof PublicSpecs, string> = {
  usable_floor_area: "Usable floor area",
  typical_floor_area: "Typical floor area",
  bedrooms: "Bedrooms",
  baths: "Toilet & bath",
  floors: "Floors",
  parking: "Parking",
}
