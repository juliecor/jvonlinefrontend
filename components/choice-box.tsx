import { Check } from "lucide-react"

/**
 * A square tick-box in the brand colour (--accent). It is a real radio underneath, so only one choice
 * of a group can be picked and it works from the keyboard; the square is just how it looks.
 */
export function ChoiceBox({
  name,
  value,
  label,
  checked,
  defaultChecked,
  onChange,
  invalid = false,
}: {
  name: string
  value: string
  label: string
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  invalid?: boolean
}) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-3 text-[15px] text-[#17150f]">
      <input type="radio" name={name} value={value} checked={checked} defaultChecked={defaultChecked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border-2 bg-white text-transparent transition peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]/40 peer-focus-visible:ring-offset-2 ${invalid ? "border-red-500" : "border-[#8a847a]"}`}
      >
        <Check className="h-4 w-4" strokeWidth={3.5} />
      </span>
      {label}
    </label>
  )
}
