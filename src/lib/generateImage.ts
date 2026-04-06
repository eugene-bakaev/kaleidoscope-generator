// src/lib/generateImage.ts
import type { PrimitiveType, PrimitiveDescriptor } from './primitives/types'
import { GENERATORS } from './primitives/index'
import { createRandom } from './primitives/random'
import type { Palette } from './palette'

export type ColorStrategy = 'random' | 'sequential' | 'by-type'

export interface GenerateImageConfig {
  enabledTypes: readonly PrimitiveType[]
  palette: Palette
  count: number          // total primitives to place (density slider)
  complexity: number     // 0–1 (complexity slider)
  seed: number
  opacityMin: number     // 0–1
  opacityMax: number     // 0–1
  colorStrategy: ColorStrategy
}

export function generateImage(config: GenerateImageConfig): PrimitiveDescriptor[] {
  const { enabledTypes, palette, count, complexity, seed, opacityMin, opacityMax, colorStrategy } = config
  const rng = createRandom(seed)
  const result: PrimitiveDescriptor[] = []

  for (let i = 0; i < count; i++) {
    const type = rng.pick([...enabledTypes])
    const generator = GENERATORS[type]

    const colors = selectColors(palette.colors, colorStrategy, i, type, enabledTypes)

    const primitiveConfig = {
      palette: colors,
      bounds: { width: 500, height: 500 },
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

function selectColors(
  colors: string[],
  strategy: ColorStrategy,
  index: number,
  type: PrimitiveType,
  enabledTypes: readonly PrimitiveType[],
): string[] {
  switch (strategy) {
    case 'sequential':
      return [colors[index % colors.length]]
    case 'by-type': {
      const typeIndex = [...enabledTypes].sort().indexOf(type)
      return [colors[typeIndex % colors.length]]
    }
    case 'random':
    default:
      return colors
  }
}
