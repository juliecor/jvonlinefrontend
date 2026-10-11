/**
 * The Broker's Accreditation Agreement as a document: the parties, the 17 terms
 * (8 holds the commission table, 15 a list), then the signatures, the witnesses
 * and the notary's acknowledgment. The wording comes from Laravel
 * (AccreditationAgreement); blanks that are filled in by hand print as lines.
 * No hooks, so it renders on the server (print page) and in the form alike.
 */

export type AgreementDoc = {
  version: string
  title: string
  developer: {
    name: string
    address: string | null
    representative: string | null
    title: string | null
  }
  broker: {
    name: string | null
    firm: string | null
    address: string | null
    citizenship: string | null
  }
  commission: { classification: string; rate: string }[]
  from: string | null
  until: string | null
  terms: {
    text: string
    commission?: boolean
    after?: string
    list?: string[]
  }[]
}

/** A line to write on, or the value when it is known. */
function Blank({ value, w = "10rem" }: { value?: string | null; w?: string }) {
  if (value) return <span className="font-bold underline decoration-1 underline-offset-4">{value}</span>
  return <span aria-label="blank" className="inline-block border-b border-current align-baseline" style={{ width: w, maxWidth: "100%" }} />
}

/** `fill` puts the realty's answers in while it types them on the form; `signing` adds the signature and notary pages. */
export function AgreementDocument({ doc, fill, signing = true }: { doc: AgreementDoc; fill?: Partial<AgreementDoc["broker"]>; signing?: boolean }) {
  const broker = {
    ...doc.broker,
    ...Object.fromEntries(Object.entries(fill ?? {}).filter(([, v]) => v && v.trim())),
  }
  const dev = doc.developer
  // Term 1 names the realty's group: the firm, once it is known.
  const text = (t: string) => (broker.firm ? t.replace("__________", broker.firm) : t)

  return (
    <div className="font-serif text-[15px] leading-relaxed text-[#17150f] print:text-[11pt]">
      <h2 className="text-center text-lg font-bold tracking-wide">{doc.title}</h2>

      <p className="mt-6">
        This agreement executed this <Blank w="5rem" /> day of <Blank w="8rem" /> at <Blank w="9rem" /> by and between:
      </p>
      <p className="mt-4">
        <strong>{dev.name.toUpperCase()}</strong>, a corporation duly organized under Philippine laws, with office address at <Blank value={dev.address} w="16rem" />, hereinafter referred to as the &ldquo;FIRST PARTY&rdquo;, and
      </p>
      <p className="mt-4">
        <Blank value={broker.name} w="14rem" />, <Blank value={broker.citizenship} w="6rem" />, of legal age, with residence at <Blank value={broker.address} w="16rem" />, hereinafter referred to as the &ldquo;SECOND PARTY&rdquo;.
      </p>
      <p className="mt-4 indent-10">For and in consideration of the mutual terms, conditions, and covenants hereinafter set forth, the FIRST PARTY and the SECOND PARTY agree as follows:</p>

      <ol className="mt-4 list-decimal space-y-3.5 pl-8 text-justify marker:font-bold">
        {doc.terms.map((t, i) => (
          <li key={i} className="pl-1">
            <p>{text(t.text)}</p>
            {t.commission && (
              <table className="mx-auto my-4 w-full max-w-md border-collapse border border-[#17150f] text-left text-[14px] print:text-[10.5pt]">
                <thead>
                  <tr>
                    <th className="border border-[#17150f] px-3 py-2 text-center font-bold">CLASSIFICATION</th>
                    <th className="border border-[#17150f] px-3 py-2 text-center font-bold">COMMISSION RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.commission.map((c, j) => (
                    <tr key={j}>
                      <td className="border border-[#17150f] px-3 py-2">{c.classification}</td>
                      <td className="border border-[#17150f] px-3 py-2 text-center">{c.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {t.after && <p>{t.after}</p>}
            {t.list && (
              <ol className="mt-3 list-[lower-alpha] space-y-2 pl-8">
                {t.list.map((item, j) => (
                  <li key={j} className="pl-1">
                    {item}
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>

      {signing && (
        <>
          <div className="break-inside-avoid-page">
            <p className="mt-6">
              <strong>INTENDING TO BE LEGALLY BOUND</strong>, the parties hereto have caused this Agreement to be executed as of the date first above written.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-[14px] print:text-[10.5pt]">
              <div>
                <p className="font-bold">FIRST PARTY:</p>
                <p className="mt-1 font-bold">{dev.name.toUpperCase()}</p>
              </div>
              <div>
                <p className="font-bold">SECOND PARTY:</p>
                {broker.firm && <p className="mt-1 font-bold">{broker.firm.toUpperCase()}</p>}
              </div>
              <Signature name={dev.representative} role={dev.title || `${dev.name} Representative`} />
              <Signature name={broker.name} role="Broker" note="signature over printed name" />
            </div>
            <p className="mt-6 text-center text-[14px] print:text-[10.5pt]">Signed in the presence of:</p>
            <div className="grid grid-cols-2 gap-x-8 text-[14px] print:text-[10.5pt]">
              <Signature role="Witness" />
              <Signature role="Witness" />
            </div>
          </div>

          <section className="mt-12 break-inside-avoid-page text-[14px] print:text-[10.5pt]">
            <h3 className="text-center font-bold tracking-wide">ACKNOWLEDGMENT</h3>
            <p className="mt-5 font-bold">REPUBLIC OF THE PHILIPPINES )</p>
            <p className="font-bold">
              <Blank w="12rem" /> ) S.S.
            </p>
            <p className="mt-4 indent-10">
              BEFORE ME, a Notary Public in and for the City of <Blank w="10rem" /> this <Blank w="4rem" /> day of <Blank w="8rem" />, personally appeared:
            </p>
            <table className="mt-4 w-full border-collapse text-left">
              <thead>
                <tr className="font-bold">
                  <th className="w-[40%] pb-6 pr-4 font-bold">Name</th>
                  <th className="w-[25%] pb-6 pr-4 font-bold">CTC No. / ID</th>
                  <th className="pb-6 font-bold">Date / Place Issued</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1].map((r) => (
                  <tr key={r}>
                    <td className="pb-6 pr-4">
                      <span className="block border-b border-current pt-4" />
                    </td>
                    <td className="pb-6 pr-4">
                      <span className="block border-b border-current pt-4" />
                    </td>
                    <td className="pb-6">
                      <span className="block border-b border-current pt-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2">all known to me and to me known to be the same persons who executed the foregoing Accreditation Agreement and acknowledged to me that the same is their own free and voluntary act and deed.</p>
            <p className="mt-4 indent-10">The FIRST PARTY&apos;s representative further acknowledges to me that the same is the free act and deed of the corporation he or she represents.</p>
            <p className="mt-4 indent-10">
              IN WITNESS WHEREOF, I have hereunto affixed my seal this <Blank w="4rem" /> day of <Blank w="8rem" />.
            </p>
            <p className="mt-12 text-right font-bold">NOTARY PUBLIC</p>
          </section>
        </>
      )}
    </div>
  )
}

function Signature({ name, role, note }: { name?: string | null; role: string; note?: string }) {
  return (
    <div className="mt-10 text-center">
      <p className="min-h-[1.5em] border-b border-current pb-0.5 font-bold">{name ?? ""}</p>
      <p className="mt-1 font-bold">{role}</p>
      {note && <p className="text-xs print:text-[8.5pt]">{note}</p>}
    </div>
  )
}
