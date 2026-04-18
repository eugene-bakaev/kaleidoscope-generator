// src/lib/generateImage.ts
import type { PrimitiveType, PrimitiveDescriptor } from './primitives/types'
import { GENERATORS } from './primitives/index'
import { createRandom } from './primitives/random'
import { type Palette } from './palette'

export interface GenerateImageConfig {
  enabledTypes: readonly PrimitiveType[]
  palette: Palette
  count: number          // total primitives to place (density slider)
  complexity: number     // 0–1 (complexity slider)
  seed: number
  opacityMin: number     // 0–1
  opacityMax: number     // 0–1
  svgSize: number        // side length of the SVG canvas
}

export function generateImage(config: GenerateImageConfig): PrimitiveDescriptor[] {
  const { enabledTypes, palette, count, complexity, seed, opacityMin, opacityMax, svgSize } = config
  const rng = createRandom(seed)
  const result: PrimitiveDescriptor[] = []

  for (let i = 0; i < count; i++) {
    const type = rng.pick([...enabledTypes])
    const generator = GENERATORS[type]

    const primitiveConfig = {
      palette: [palette.colors[i % palette.colors.length]],
      bounds: { width: svgSize, height: svgSize },
      rng: createRandom(rng.randInt(0, 0xffffffff)),
      complexity,
      opacityMin,
      opacityMax,
    }
    const descriptors = generator(primitiveConfig)
    result.push(...descriptors)
  }

  return result
}
