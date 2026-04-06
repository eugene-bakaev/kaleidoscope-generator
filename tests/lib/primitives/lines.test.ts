// tests/lib/primitives/lines.test.ts
import { describe, it, expect } from 'vitest'
import { generateLines } from '@/lib/primitives/lines'
import { createRandom } from '@/lib/primitives/random'

const config = {
  palette: ['#ff0000', '#00ff00', '#0000ff'],
  bounds: { width: 500, height: 500 },
  rng: createRandom(3),
  complexity: 0.5,
  opacityMin: 0.4,
  opacityMax: 1.0,
}

describe('generateLines', () => {
  it('returns line descriptors', () => {
    const result = generateLines(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('line')
      expect(typeof d.x1).toBe('number')
      expect(typeof d.y1).toBe('number')
      expect(typeof d.x2).toBe('number')
      expect(typeof d.y2).toBe('number')
    }
  })
})
