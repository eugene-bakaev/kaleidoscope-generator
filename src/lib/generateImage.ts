// src/lib/generateImage.ts
import type { PrimitiveType, PrimitiveDescriptor } from './primitives/types'
import { GENERATORS } from './primitives/index'
import { createRandom } from './primitives/random'
import type { Palette } from './palette'

export interface GenerateImageConfig {
  enabledTypes: readonly PrimitiveType[]
  palette: Palette
  count: number          // total primitives to place (density slider)
  complexity: number     // 0–1 (complexity slider)
  seed: number
}

export function generateImage(config: GenerateImageConfig): PrimitiveDescriptor[] {
  const { enabledTypes, palette, count, complexity, seed } = config
  const rng = createRandom(seed)
  const result: PrimitiveDescriptor[] = []

  // Distribute count primitives across enabled types
  for (let i = 0; i < count; i++) {
    const type = rng.pick([...enabledTypes])
    const generator = GENERATORS[type]
    const primitiveConfig = { palette: palette.colors, bounds: { width: 500, height: 500 }, rng: createRandom(rng.randInt(0, 0xffffffff)), complexity }
    const descriptors = generator(primitiveConfig)
    result.push(...descriptors)
  }

  return result
}
