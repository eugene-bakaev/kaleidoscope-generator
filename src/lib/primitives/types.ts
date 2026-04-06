// src/lib/primitives/types.ts

export type PrimitiveType =
  | 'circles'
  | 'concentricCircles'
  | 'spirals'
  | 'zigzags'
  | 'lines'
  | 'dots'
  | 'polygons'
  | 'sines'

export interface BoundingBox {
  width: number
  height: number
}

export interface PrimitiveConfig {
  palette: string[]        // array of hex color strings
  bounds: BoundingBox
  rng: Rng
  complexity: number       // 0–1, feeds per-generator params
  opacityMin: number       // 0–1
  opacityMax: number       // 0–1, >= opacityMin
}

export interface CircleDescriptor {
  tag: 'circle'
  cx: number; cy: number; r: number
  fill: string; stroke: string; strokeWidth: number; opacity: number
}

export interface LineDescriptor {
  tag: 'line'
  x1: number; y1: number; x2: number; y2: number
  stroke: string; strokeWidth: number; opacity: number
}

export interface PolylineDescriptor {
  tag: 'polyline'
  points: string
  stroke: string; strokeWidth: number; fill: string; opacity: number
}

export interface PolygonDescriptor {
  tag: 'polygon'
  points: string
  fill: string; stroke: string; strokeWidth: number; opacity: number
}

export interface PathDescriptor {
  tag: 'path'
  d: string
  fill: string; stroke: string; strokeWidth: number; opacity: number
}

export type PrimitiveDescriptor =
  | CircleDescriptor
  | LineDescriptor
  | PolylineDescriptor
  | PolygonDescriptor
  | PathDescriptor

export interface Rng {
  (): number                          // random float [0, 1)
  randInt: (min: number, max: number) => number  // int in [min, max)
  pick: <T>(arr: T[]) => T
}
