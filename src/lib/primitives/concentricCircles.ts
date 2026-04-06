// src/lib/primitives/concentricCircles.ts
import type { PrimitiveConfig, CircleDescriptor } from './types'

export function generateConcentricCircles(config: PrimitiveConfig): CircleDescriptor[] {
  const { palette, bounds, rng, complexity, opacityMin, opacityMax } = config
  const groupCount = Math.round(1 + complexity * 3)  // 1–4 groups
  const result: CircleDescriptor[] = []

  for (let g = 0; g < groupCount; g++) {
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const ringCount = Math.round(2 + complexity * 4)  // 2–6 rings
    const maxR = 20 + rng() * 60

    for (let i = ringCount; i >= 1; i--) {
      const r = (maxR / ringCount) * i
      const color = rng.pick(palette)
      result.push({
        tag: 'circle',
        cx, cy, r,
        fill: 'none',
        stroke: color,
        strokeWidth: 1 + rng() * 2,
        opacity: opacityMin + rng() * (opacityMax - opacityMin),
      })
    }
  }

  return result
}
