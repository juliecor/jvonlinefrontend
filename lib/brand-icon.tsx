import { ImageResponse } from "next/og"

/**
 * Browser-tab icons: a flat square in the brand colour with a letter or two.
 * Used for jvconline itself and for realties that have no icon of their own.
 */

export const ICON_SIZE = { width: 64, height: 64 }

const isHex = (c: string | null | undefined): c is string => !!c && /^#[0-9a-f]{3,8}$/i.test(c)

/** "Demo Realty" → "D", "Filipino Homes Inc." → "FH": the first letters of the words that aren't company boilerplate. */
export function initials(name: string) {
  const words = name.split(/\s+/).filter((w) => w && !/^(realty|realties|real|estate|properties|property|inc\.?|corp\.?|corporation|co\.?|ltd\.?|the|and|&)$/i.test(w))
  return (words.slice(0, 2).map((w) => w[0]).join("") || name.trim()[0] || "?").toUpperCase()
}

export function letterIcon(letters: string, background?: string | null) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // The dashboard's default accent when a realty hasn't picked a colour.
          background: isHex(background) ? background : "#1f2937",
          color: "#ffffff",
          fontSize: letters.length > 1 ? 40 : 52,
          letterSpacing: letters.length > 1 ? "-0.02em" : 0,
          // Only a regular-weight font is bundled; the outline makes it read bold at tab size.
          WebkitTextStroke: "2.5px #ffffff",
          paddingBottom: 5,
        }}
      >
        {letters}
      </div>
    ),
    ICON_SIZE,
  )
}
