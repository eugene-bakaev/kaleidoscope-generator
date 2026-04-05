// src/lib/primitives/lines.ts
import type { PrimitiveConfig, LineDescriptor } from './types'

export function generateLines(config: PrimitiveConfig): LineDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(3 + complexity * 10)

  return Array.from({ length: count }, () => {
    const x1 = rng() * bounds.width
    const y1 = rng() * bounds.height
    const angle = rng() * Math.PI * 2
    const length = 40 + rng() * (bounds.width * 0.5)
    return {
      tag: 'line' as const,
      x1, y1,
      x2: x1 + Math.cos(angle) * length,
      y2: y1 + Math.sin(angle) * length,
      stroke: rng.pick(palette),
      strokeWidth: 1 + rng() * 3,
      opacity: 0.4 + rng() * 0.6,
    }
  })
}
