"use client"

import { PH_DOTS, PH_GRID } from "@/lib/ph-dots"

// [col,row] pairs → points on the grid; the SVG is in grid units, so the viewBox crops to the islands.
const DOTS = (() => {
  const out: { x: number; y: number; t: number }[] = []
  for (let i = 0; i < PH_DOTS.length; i += 2) out.push({ x: PH_DOTS[i], y: PH_DOTS[i + 1], t: PH_DOTS[i + 1] / PH_GRID.rows })
  return out
})()

// North is sky blue, south drifts to violet — one gradient across the whole country.
const NORTH = [125, 211, 252]
const SOUTH = [167, 139, 250]
const tint = (t: number) => `rgb(${NORTH.map((n, i) => Math.round(n + (SOUTH[i] - n) * t)).join(",")})`

/** The whole Philippines as a field of dots that glow in a slow wave from north to south. */
export function PhMap({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="17 48 70 82" preserveAspectRatio="xMidYMid meet" className={className} role="img" aria-label="Map of the Philippines">
      <defs>
        <radialGradient id="jv-glow" cx="55%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="17" y="48" width="70" height="82" fill="url(#jv-glow)" />
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={0.4} fill={tint(d.t)} className="jv-dot" style={{ animationDelay: `${d.y * 45 + (d.x % 7) * 40}ms` }} />
      ))}
    </svg>
  )
}
