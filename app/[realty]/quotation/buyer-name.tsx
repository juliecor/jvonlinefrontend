"use client"

/**
 * "Prepared for": the buyer's name, typed or fixed right on the page before printing. On screen it's a
 * dashed field; on paper just the name (or a line to write it on).
 */
export function BuyerName({ initial }: { initial: string | null }) {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Buyer's name"
      data-placeholder="Type the buyer's name"
      className="block min-h-[1.6em] rounded-md border border-dashed border-[#c9c4bb] px-2 py-0.5 text-[16px] font-bold text-[#17150f] outline-none empty:before:font-normal empty:before:text-[#a39d92] empty:before:content-[attr(data-placeholder)] focus:border-[var(--accent)] print:rounded-none print:border-0 print:border-b print:border-solid print:border-[#17150f] print:px-0 print:empty:before:content-none"
    >
      {initial ?? ""}
    </span>
  )
}
