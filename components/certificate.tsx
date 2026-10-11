import { Cinzel, Cormorant_Garamond } from "next/font/google"
import { longDate } from "@/lib/format"

const engraved = Cinzel({ subsets: ["latin"], weight: ["500", "700"] })
const garamond = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"] })

/** A certificate of accreditation, as Laravel sends it (AccreditationCertificate::toPayload). */
export type CertificateData = {
  number: string
  code: string
  verify_url: string
  firm: string
  /** Left out on the public check page. */
  representative: string | null
  developer: { name: string; logo_url: string | null; accent_color: string | null }
  from: string
  until: string
  issued_at: string
  signer: { name: string | null; title: string | null }
  status: "valid" | "expired" | "ended" | "replaced"
}

/** "1 YEAR" or "2 YEARS" when the period is whole years, else the years it spans ("2026", "2026–2027"). */
export function termLabel(from: string, until: string) {
  const [y, m, d] = from.split("-").map(Number)
  for (let n = 1; n <= 10; n++) {
    const end = new Date(Date.UTC(y + n, m - 1, d))
    end.setUTCDate(end.getUTCDate() - 1)
    if (end.toISOString().slice(0, 10) === until) return `${n} YEAR${n === 1 ? "" : "S"}`
  }
  return from.slice(0, 4) === until.slice(0, 4) ? from.slice(0, 4) : `${from.slice(0, 4)}–${until.slice(0, 4)}`
}

const NOT_VALID = { expired: "EXPIRED", ended: "NO LONGER VALID", replaced: "REPLACED" } as const

/**
 * The certificate itself: a landscape A4 sheet with a double frame in the developer's colour,
 * its logo, the realty's name, the period, a seal, the signer and the number to check it by.
 * Every size is in container units, so it reads the same on a phone, a laptop and on paper.
 */
export function Certificate({ c }: { c: CertificateData }) {
  const accent = c.developer.accent_color ?? "#b4241c"
  const ring = `${c.developer.name.toUpperCase()} • ACCREDITED BROKER • `
  const verify = c.verify_url.replace(/^https?:\/\//, "")

  return (
    <div className="@container w-full">
      <div style={{ ["--cert" as string]: accent }} className={`${garamond.className} relative aspect-[297/210] w-full overflow-hidden bg-[#fffdf7] text-[#1d1a14] [-webkit-print-color-adjust:exact] [print-color-adjust:exact]`}>
        {/* The frame: a strong line in the brand colour, a fine gold line inside it, and corner marks. */}
        <div aria-hidden className="absolute inset-[2.4cqw] border-[0.45cqw] border-[var(--cert)]" />
        <div aria-hidden className="absolute inset-[3.5cqw] border-[0.12cqw] border-[#b89b5e]" />
        {(["left-[3.5cqw] top-[3.5cqw]", "right-[3.5cqw] top-[3.5cqw] rotate-90", "bottom-[3.5cqw] right-[3.5cqw] rotate-180", "bottom-[3.5cqw] left-[3.5cqw] -rotate-90"] as const).map((pos) => (
          <svg key={pos} aria-hidden viewBox="0 0 40 40" className={`absolute h-[5cqw] w-[5cqw] ${pos}`}>
            <path d="M0 0h40v3H3v37H0z" fill="#b89b5e" />
            <path d="M8 8h16v2H10v14H8z" fill="var(--cert)" />
            <rect x="13" y="13" width="5" height="5" transform="rotate(45 15.5 15.5)" fill="#b89b5e" />
          </svg>
        ))}

        <div className="absolute inset-x-[8cqw] bottom-[6.2cqw] top-[5.6cqw] flex flex-col items-center text-center">
          {c.developer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.developer.logo_url} alt={c.developer.name} className="h-[6.5cqw] w-auto object-contain" />
          ) : (
            <p className={`${engraved.className} text-[2.4cqw] font-bold text-[var(--cert)]`}>{c.developer.name}</p>
          )}

          <p className={`${engraved.className} mt-[1.6cqw] text-[1.35cqw] font-bold tracking-[0.55em] text-[var(--cert)]`}>CERTIFICATE OF</p>
          <h1 className={`${engraved.className} mt-[0.2cqw] text-[4.6cqw] font-bold leading-none tracking-[0.14em]`}>ACCREDITATION</h1>
          <Divider />

          <p className="mt-[0.4cqw] text-[1.75cqw] font-medium text-[#5b5346]">This certifies that</p>
          <p className={`${engraved.className} mt-[0.7cqw] max-w-full text-[3.6cqw] font-bold leading-tight tracking-[0.04em] text-[var(--cert)]`}>{c.firm}</p>
          {c.representative && <p className="mt-[0.3cqw] text-[1.6cqw] font-semibold text-[#5b5346]">represented by {c.representative}</p>}
          <p className="mt-[1cqw] max-w-[68cqw] text-[1.75cqw] font-medium leading-snug">
            is an accredited broker of <span className="font-bold">{c.developer.name.toUpperCase()}</span>, authorized to promote, market and sell its projects under the Broker&apos;s Accreditation Agreement.
          </p>
          <p className="mt-[1.2cqw] border-y border-[#b89b5e] px-[2cqw] py-[0.5cqw] text-[1.8cqw] font-bold tracking-[0.02em]">
            Valid from {longDate(c.from)} to {longDate(c.until)}
          </p>

          {/* Signer · seal · number */}
          <div className="mt-auto grid w-full grid-cols-[1fr_auto_1fr] items-end gap-[3cqw]">
            <div className="text-center">
              <div className="mx-auto h-[3.2cqw] w-[80%] border-b-[0.12cqw] border-[#1d1a14]" />
              <p className="mt-[0.5cqw] text-[1.6cqw] font-bold leading-tight">{c.signer.name ?? c.developer.name}</p>
              <p className="text-[1.3cqw] font-semibold leading-tight text-[#5b5346]">{c.signer.title ?? "Authorized Representative"}</p>
              <p className="text-[1.15cqw] font-medium leading-tight text-[#5b5346]">for {c.developer.name}</p>
            </div>

            <svg viewBox="0 0 200 200" className="h-[13cqw] w-[13cqw]" role="img" aria-label={`Seal: ${termLabel(c.from, c.until)}`}>
              <defs>
                <path id="cert-seal-ring" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
              </defs>
              <circle cx="100" cy="100" r="97" fill="#b89b5e" />
              <circle cx="100" cy="100" r="92" fill="var(--cert)" />
              <circle cx="100" cy="100" r="86" fill="none" stroke="#f3e6c4" strokeWidth="1.2" />
              <circle cx="100" cy="100" r="58" fill="none" stroke="#f3e6c4" strokeWidth="1.2" />
              <text fill="#fdf6e3" fontSize="12.5" fontWeight="700" letterSpacing="1.5" className={engraved.className}>
                <textPath href="#cert-seal-ring" textLength="446" lengthAdjust="spacingAndGlyphs">
                  {ring}
                </textPath>
              </text>
              <path d="M100 52l3.5 7.2 8 1.2-5.8 5.6 1.4 7.9-7.1-3.7-7.1 3.7 1.4-7.9-5.8-5.6 8-1.2z" fill="#f3e6c4" />
              <text x="100" y="112" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="700" className={engraved.className}>
                {termLabel(c.from, c.until)}
              </text>
              <text x="100" y="134" textAnchor="middle" fill="#f3e6c4" fontSize="11" fontWeight="700" letterSpacing="1.5" className={engraved.className}>
                {c.from.slice(0, 4) === c.until.slice(0, 4) ? c.from.slice(0, 4) : `${c.from.slice(0, 4)} – ${c.until.slice(0, 4)}`}
              </text>
            </svg>

            <div className="text-center">
              <p className="text-[1.15cqw] font-bold tracking-[0.2em] text-[#5b5346]">CERTIFICATE NO.</p>
              <p className={`${engraved.className} text-[1.75cqw] font-bold leading-tight`}>{c.number}</p>
              <p className="mt-[0.5cqw] text-[1.3cqw] font-semibold leading-tight text-[#5b5346]">Issued {longDate(c.issued_at)}</p>
              <p className="mt-[0.4cqw] text-[1.15cqw] font-semibold leading-tight text-[#5b5346]">
                Check it at
                <br />
                <span className="font-bold text-[#1d1a14]">{verify}</span>
              </p>
            </div>
          </div>
        </div>

        {c.status !== "valid" && (
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className={`${engraved.className} -rotate-[18deg] border-[0.5cqw] border-red-700/60 px-[3cqw] py-[1cqw] text-[6.5cqw] font-bold tracking-[0.12em] text-red-700/60`}>{NOT_VALID[c.status]}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <svg aria-hidden viewBox="0 0 240 16" className="mt-[1cqw] h-[1.4cqw] w-[22cqw]">
      <path d="M0 8h100M140 8h100" stroke="#b89b5e" strokeWidth="1.5" />
      <rect x="114" y="2" width="12" height="12" transform="rotate(45 120 8)" fill="var(--cert)" />
      <circle cx="104" cy="8" r="2.2" fill="#b89b5e" />
      <circle cx="136" cy="8" r="2.2" fill="#b89b5e" />
    </svg>
  )
}
