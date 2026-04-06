// src/lib/primitives/circles.ts
import type { PrimitiveConfig, CircleDescriptor } from './types'

export function generateCircles(config: PrimitiveConfig): CircleDescriptor[] {
  const { palette, bounds, rng, complexity, opacityMin, opacityMax } = config
  const count = Math.round(3 + complexity * 7)  // 3–10 circles
  const result: CircleDescriptor[] = []

  for (let i = 0; i < count; i++) {
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const r = 10 + rng() * (30 + complexity * 60)
    const color = rng.pick(palette)
    const useStroke = rng() > 0.5

    result.push({
      tag: 'circle',
      cx, cy, r,
      fill: useStroke ? 'none' : color,
      stroke: useStroke ? color : 'none',
      strokeWidth: useStroke ? 1 + rng() * 3 : 0,
      opacity: opacityMin + rng() * (opacityMax - opacityMin),
    })
  }

  return result
}
