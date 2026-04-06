// src/lib/primitives/polygons.ts
import type { PrimitiveConfig, PolygonDescriptor } from './types'

export function generatePolygons(config: PrimitiveConfig): PolygonDescriptor[] {
  const { palette, bounds, rng, complexity, opacityMin, opacityMax } = config
  const count = Math.round(2 + complexity * 6)

  return Array.from({ length: count }, () => {
    const sides = rng.randInt(3, 6)  // 3, 4, or 5 sides
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const r = 15 + rng() * 50
    const rotation = rng() * Math.PI * 2
    const color = rng.pick(palette)
    const useStroke = rng() > 0.4

    const pts = Array.from({ length: sides }, (_, i) => {
      const angle = rotation + (i / sides) * Math.PI * 2
      return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`
    }).join(' ')

    return {
      tag: 'polygon' as const,
      points: pts,
      fill: useStroke ? 'none' : color,
      stroke: useStroke ? color : 'none',
      strokeWidth: useStroke ? 1 + rng() * 2 : 0,
      opacity: opacityMin + rng() * (opacityMax - opacityMin),
    }
  })
}
