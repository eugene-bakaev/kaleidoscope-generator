// src/lib/primitives/sines.ts
import type { PrimitiveConfig, PathDescriptor } from './types'

export function generateSines(config: PrimitiveConfig): PathDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(1 + complexity * 3)

  return Array.from({ length: count }, () => {
    const y0 = rng() * bounds.height
    const amplitude = 15 + rng() * (20 + complexity * 40)
    const frequency = 1 + rng() * (1 + complexity * 2)
    const steps = 60
    const color = rng.pick(palette)

    let d = ''
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * bounds.width
      const y = y0 + Math.sin((i / steps) * Math.PI * 2 * frequency) * amplitude
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    }

    return {
      tag: 'path' as const,
      d,
      fill: 'none',
      stroke: color,
      strokeWidth: 1 + rng() * 3,
      opacity: 0.5 + rng() * 0.5,
    }
  })
}
