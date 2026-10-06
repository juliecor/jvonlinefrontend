/** Shared bits for the plain forms (login, register, join, invite). */

export const fieldClass =
  "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50 disabled:text-slate-500"

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{children}</span>
}

export function Alert({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return kind === "error" ? (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {children}
    </p>
  ) : (
    <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
      {children}
    </p>
  )
}

/** A realty's logo, or its name set in type when it has none. Plain <img>: logos may live on the Laravel host. */
export function RealtyMark({ name, logo, className = "h-12" }: { name: string; logo: string | null; className?: string }) {
  return logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt={name} className={`${className} w-auto max-w-[220px] object-contain`} />
  ) : (
    <span className="text-2xl font-semibold tracking-tight text-slate-900">{name}</span>
  )
}
