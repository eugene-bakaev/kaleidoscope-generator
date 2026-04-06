// src/lib/primitives/zigzags.ts
import type { PrimitiveConfig, PolylineDescriptor } from './types'

export function generateZigzags(config: PrimitiveConfig): PolylineDescriptor[] {
  const { palette, bounds, rng, complexity, opacityMin, opacityMax } = config
  const count = Math.round(1 + complexity * 3)

  return Array.from({ length: count }, () => {
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const rotation = rng() * Math.PI * 2
    const steps = Math.round(4 + complexity * 8)
    const stepW = (bounds.width * 0.6) / steps
    const amplitude = 10 + rng() * (20 + complexity * 40)
    const totalLength = steps * stepW
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    const pts = Array.from({ length: steps + 1 }, (_, i) => {
      const along = -totalLength / 2 + i * stepW
      const perp = i % 2 === 0 ? -amplitude : amplitude
      const x = cx + cos * along - sin * perp
      const y = cy + sin * along + cos * perp
      return `${x},${y}`
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
