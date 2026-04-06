// tests/lib/generateImage.test.ts
import { describe, it, expect } from 'vitest'
import { generateImage } from '@/lib/generateImage'
import { PALETTES } from '@/lib/palette'
import type { CircleDescriptor } from '@/lib/primitives/types'

const config = {
  enabledTypes: ['circles', 'dots', 'lines'] as const,
  palette: PALETTES[0],
  count: 10,
  complexity: 0.5,
  seed: 42,
  opacityMin: 0.4,
  opacityMax: 1.0,
  colorStrategy: 'random' as const,
}

describe('generateImage', () => {
  it('returns an array of PrimitiveDescriptors', () => {
    const result = generateImage(config)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(['circle', 'line', 'polyline', 'polygon', 'path']).toContain(d.tag)
    }
  })

  it('is deterministic for the same seed', () => {
    const r1 = generateImage(config)
    const r2 = generateImage(config)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('produces different results for different seeds', () => {
    const r1 = generateImage({ ...config, seed: 1 })
    const r2 = generateImage({ ...config, seed: 2 })
    expect(JSON.stringify(r1)).not.toBe(JSON.stringify(r2))
  })

  it('only uses enabled primitive types', () => {
    const result = generateImage({ ...config, enabledTypes: ['dots'] })
    for (const d of result) {
      expect(d.tag).toBe('circle')
      expect((d as CircleDescriptor).r).toBeLessThanOrEqual(10)
    }
  })
})
