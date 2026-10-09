/** How long an offer stays open for the buyer. The agent picks one when making it, and can extend it later. */
export const VALIDITY = [
  { hours: 3, label: "3 hours" },
  { hours: 24, label: "1 day" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
] as const

export const DEFAULT_VALIDITY = 3
