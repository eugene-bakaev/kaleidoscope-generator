// tests/lib/primitives/dots.test.ts
import { describe, it, expect } from 'vitest'
import { generateDots } from '@/lib/primitives/dots'
import { createRandom } from '@/lib/primitives/random'

const config = {
  palette: ['#ff0000', '#00ff00', '#0000ff'],
  bounds: { width: 500, height: 500 },
  rng: createRandom(2),
  complexity: 0.5,
}

describe('generateDots', () => {
  it('returns circle descriptors with small radii', () => {
    const result = generateDots(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('circle')
      expect(d.r).toBeLessThanOrEqual(10)
    }
  })
})
