// tests/lib/primitives/random.test.ts
import { describe, it, expect } from 'vitest'
import { createRandom } from '@/lib/primitives/random'

describe('createRandom', () => {
  it('returns values between 0 and 1', () => {
    const rng = createRandom(42)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('produces deterministic sequences for the same seed', () => {
    const rng1 = createRandom(123)
    const rng2 = createRandom(123)
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2())
    }
  })

  it('produces different sequences for different seeds', () => {
    const rng1 = createRandom(1)
    const rng2 = createRandom(2)
    const results1 = Array.from({ length: 10 }, () => rng1())
    const results2 = Array.from({ length: 10 }, () => rng2())
    expect(results1).not.toEqual(results2)
  })

  it('randInt returns integers in [min, max)', () => {
    const rng = createRandom(7)
    for (let i = 0; i < 50; i++) {
      const v = rng.randInt(3, 8)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThan(8)
    }
  })

  it('pick returns an element from the array', () => {
    const rng = createRandom(99)
    const arr = ['a', 'b', 'c']
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(rng.pick(arr))
    }
  })
})
