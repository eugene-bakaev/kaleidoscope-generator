// tests/lib/primitives/sines.test.ts
import { describe, it, expect } from 'vitest'
import { generateSines } from '@/lib/primitives/sines'
import { createRandom } from '@/lib/primitives/random'

describe('generateSines', () => {
  it('returns path descriptors', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(14), complexity: 0.5 }
    const result = generateSines(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('path')
    }
  })
})
