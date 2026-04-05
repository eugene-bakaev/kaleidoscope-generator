// src/lib/primitives/random.ts
import type { Rng } from './types'

export function createRandom(seed: number): Rng {
  let s = seed >>> 0

  function next(): number {
    s += 0x6d2b79f5
    let z = s
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000
  }

  next.randInt = (min: number, max: number): number =>
    Math.floor(next() * (max - min)) + min

  next.pick = <T>(arr: T[]): T => {
    if (arr.length === 0) throw new RangeError('pick called on empty array')
    return arr[next.randInt(0, arr.length)]
  }

  return next
}
