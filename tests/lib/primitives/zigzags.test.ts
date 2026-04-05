// tests/lib/primitives/zigzags.test.ts
import { describe, it, expect } from 'vitest'
import { generateZigzags } from '@/lib/primitives/zigzags'
import { createRandom } from '@/lib/primitives/random'

describe('generateZigzags', () => {
  it('returns polyline descriptors', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(12), complexity: 0.5 }
    const result = generateZigzags(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('polyline')
    }
  })
})
