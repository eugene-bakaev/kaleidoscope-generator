// tests/lib/primitives/concentricCircles.test.ts
import { describe, it, expect } from 'vitest'
import { generateConcentricCircles } from '@/lib/primitives/concentricCircles'
import { createRandom } from '@/lib/primitives/random'

describe('generateConcentricCircles', () => {
  it('returns multiple circles sharing the same center', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(10), complexity: 0.5, opacityMin: 0.4, opacityMax: 1.0 }
    const result = generateConcentricCircles(config)
    expect(result.length).toBeGreaterThan(0)
    // All descriptors in a group share the same cx/cy — check first group
    const cx = result[0].cx
    const cy = result[0].cy
    // At minimum 2 circles with same center in the first group
    const sameCenter = result.filter(d => d.cx === cx && d.cy === cy)
    expect(sameCenter.length).toBeGreaterThanOrEqual(2)
  })
})
