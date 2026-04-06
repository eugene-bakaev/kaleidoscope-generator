// tests/lib/primitives/spirals.test.ts
import { describe, it, expect } from 'vitest'
import { generateSpirals } from '@/lib/primitives/spirals'
import { createRandom } from '@/lib/primitives/random'

describe('generateSpirals', () => {
  it('returns path descriptors', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(13), complexity: 0.5, opacityMin: 0.4, opacityMax: 1.0 }
    const result = generateSpirals(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('path')
      expect(d.d.startsWith('M')).toBe(true)
    }
  })
})
