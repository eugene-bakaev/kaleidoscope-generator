// src/lib/primitives/sines.ts
import type { PrimitiveConfig, PathDescriptor } from './types'

export function generateSines(config: PrimitiveConfig): PathDescriptor[] {
  const { palette, bounds, rng, complexity, opacityMin, opacityMax } = config
  const count = Math.round(1 + complexity * 3)

  return Array.from({ length: count }, () => {
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const rotation = rng() * Math.PI * 2
    const length = bounds.width * (0.4 + rng() * 0.6)
    const amplitude = 15 + rng() * (20 + complexity * 40)
    const frequency = 1 + rng() * (1 + complexity * 2)
    const steps = 60
    const color = rng.pick(palette)

    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    let d = ''
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) - 0.5
      const along = t * length
      const perp = Math.sin(t * Math.PI * 2 * frequency) * amplitude
      const x = cx + cos * along - sin * perp
      const y = cy + sin * along + cos * perp
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    }

    return {
      tag: 'path' as const,
      d,
      fill: 'none',
      stroke: color,
      strokeWidth: 1 + rng() * 3,
      opacity: opacityMin + rng() * (opacityMax - opacityMin),
    }
  })
}
