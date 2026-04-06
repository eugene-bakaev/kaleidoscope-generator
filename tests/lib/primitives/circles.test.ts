// tests/lib/primitives/circles.test.ts
import { describe, it, expect } from 'vitest'
import { generateCircles } from '@/lib/primitives/circles'
import { createRandom } from '@/lib/primitives/random'

const config = {
  palette: ['#ff0000', '#00ff00', '#0000ff'],
  bounds: { width: 500, height: 500 },
  rng: createRandom(1),
  complexity: 0.5,
  opacityMin: 0.4,
  opacityMax: 1.0,
}

describe('generateCircles', () => {
  it('returns an array of circle descriptors', () => {
    const result = generateCircles(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('circle')
      expect(typeof d.cx).toBe('number')
      expect(typeof d.cy).toBe('number')
      expect(d.r).toBeGreaterThan(0)
      expect(config.palette).toContain(d.fill === 'none' ? d.stroke : d.fill)
    }
  })

  it('keeps circles within reasonable bounds', () => {
    const result = generateCircles(config)
    for (const d of result) {
      expect(d.cx).toBeGreaterThanOrEqual(0)
      expect(d.cx).toBeLessThanOrEqual(config.bounds.width)
      expect(d.cy).toBeGreaterThanOrEqual(0)
      expect(d.cy).toBeLessThanOrEqual(config.bounds.height)
    }
  })
})
