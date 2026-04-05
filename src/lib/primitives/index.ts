// src/lib/primitives/index.ts
import type { PrimitiveType, PrimitiveConfig, PrimitiveDescriptor } from './types'
import { generateCircles } from './circles'
import { generateConcentricCircles } from './concentricCircles'
import { generateSpirals } from './spirals'
import { generateZigzags } from './zigzags'
import { generateLines } from './lines'
import { generateDots } from './dots'
import { generatePolygons } from './polygons'
import { generateSines } from './sines'

export type { PrimitiveType, PrimitiveConfig, PrimitiveDescriptor }

export const GENERATORS: Record<PrimitiveType, (config: PrimitiveConfig) => PrimitiveDescriptor[]> = {
  circles: generateCircles,
  concentricCircles: generateConcentricCircles,
  spirals: generateSpirals,
  zigzags: generateZigzags,
  lines: generateLines,
  dots: generateDots,
  polygons: generatePolygons,
  sines: generateSines,
}
