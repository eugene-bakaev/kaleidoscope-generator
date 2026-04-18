// tests/lib/palette.test.ts
import { describe, it, expect } from 'vitest'
import { PALETTES, getLightestColor } from '@/lib/palette'

describe('PALETTES', () => {
  it('has at least 6 palettes', () => {
    expect(PALETTES.length).toBeGreaterThanOrEqual(6)
  })

  it('each palette has 5–6 colors', () => {
    for (const p of PALETTES) {
      expect(p.colors.length).toBeGreaterThanOrEqual(5)
      expect(p.colors.length).toBeLessThanOrEqual(6)
    }
  })

  it('each color is a valid hex string', () => {
    const hexRe = /^#[0-9a-fA-F]{6}$/
    for (const p of PALETTES) {
      for (const c of p.colors) {
        expect(c).toMatch(hexRe)
      }
    }
  })

  it('each palette has a unique id', () => {
    const ids = PALETTES.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getLightestColor', () => {
  it('returns the lightest hex color from the list', () => {
    const light = getLightestColor(['#ffffff', '#000000', '#888888'])
    expect(light).toBe('#ffffff')
  })
})
