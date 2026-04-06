// src/lib/primitives/spirals.ts
import type { PrimitiveConfig, PathDescriptor } from './types'

export function generateSpirals(config: PrimitiveConfig): PathDescriptor[] {
  const { palette, bounds, rng, complexity, opacityMin, opacityMax } = config
  const count = Math.round(1 + complexity * 2)

  return Array.from({ length: count }, () => {
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const turns = 2 + Math.round(complexity * 3)  // 2–5 turns
    const maxR = 20 + rng() * 60
    const steps = turns * 24
    const color = rng.pick(palette)

    let d = ''
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const angle = t * turns * Math.PI * 2
      const r = t * maxR
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    }

    return {
      tag: 'path' as const,
      d,
      fill: 'none',
      stroke: color,
      strokeWidth: 1 + rng() * 2,
      opacity: opacityMin + rng() * (opacityMax - opacityMin),
    }
  })
}
