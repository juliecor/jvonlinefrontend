/** "Johndorf AI" for Johndorf Ventures Corporation: the realty's name without the company words (same rule as Laravel's Assistant::nameFor). */
export function assistantName(realty: string): string {
  const short = realty
    .replace(/\b(ventures?|corporation|corp\.?|inc\.?|realty|realties|properties|property|development|developers?|holdings?|co\.?)(?=\s|$)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
  return `${short || realty} AI`
}
