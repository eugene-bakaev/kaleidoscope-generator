// tests/lib/primitives/polygons.test.ts
import { describe, it, expect } from 'vitest'
import { generatePolygons } from '@/lib/primitives/polygons'
import { createRandom } from '@/lib/primitives/random'

describe('generatePolygons', () => {
  it('returns polygon descriptors', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(11), complexity: 0.5 }
    const result = generatePolygons(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('polygon')
      expect(typeof d.points).toBe('string')
      expect(d.points.length).toBeGreaterThan(0)
    }
  })
})
