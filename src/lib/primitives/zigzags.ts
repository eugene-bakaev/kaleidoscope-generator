// src/lib/primitives/zigzags.ts
import type { PrimitiveConfig, PolylineDescriptor } from './types'

export function generateZigzags(config: PrimitiveConfig): PolylineDescriptor[] {
  const { palette, bounds, rng, complexity, opacityMin, opacityMax } = config
  const count = Math.round(1 + complexity * 3)

  return Array.from({ length: count }, () => {
    const startX = rng() * bounds.width * 0.5
    const y = rng() * bounds.height
    const steps = Math.round(4 + complexity * 8)
    const stepW = (bounds.width * 0.6) / steps
    const amplitude = 10 + rng() * (20 + complexity * 40)

    const pts = Array.from({ length: steps + 1 }, (_, i) => {
      const x = startX + i * stepW
      const dy = i % 2 === 0 ? -amplitude : amplitude
      return `${x},${y + dy}`
    }).join(' ')

    return {
      tag: 'polyline' as const,
      points: pts,
      stroke: rng.pick(palette),
      strokeWidth: 1 + rng() * 3,
      fill: 'none',
      opacity: opacityMin + rng() * (opacityMax - opacityMin),
    }
  })
}
