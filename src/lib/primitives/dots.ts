// src/lib/primitives/dots.ts
import type { PrimitiveConfig, CircleDescriptor } from './types'

export function generateDots(config: PrimitiveConfig): CircleDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(10 + complexity * 30)  // 10–40 dots

  return Array.from({ length: count }, () => ({
    tag: 'circle' as const,
    cx: rng() * bounds.width,
    cy: rng() * bounds.height,
    r: 2 + rng() * 8,
    fill: rng.pick(palette),
    stroke: 'none',
    strokeWidth: 0,
    opacity: 0.5 + rng() * 0.5,
  }))
}
