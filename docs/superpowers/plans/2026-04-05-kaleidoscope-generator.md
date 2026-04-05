# Kaleidoscope Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based kaleidoscope builder where users generate a random SVG base image from geometric primitives, select a triangular region, and compose it into a kaleidoscope pattern.

**Architecture:** SVG for base image generation (geometric primitives as plain descriptor objects mapped to React JSX), HTML Canvas 2D for kaleidoscope compositing (SVG rasterized via `renderToStaticMarkup` + Blob URL + `drawImage`). Single Next.js page with a three-column layout: controls | base image + triangle selector | kaleidoscope preview.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Vitest + React Testing Library

---

## File Map

```
src/
  app/
    page.tsx                        ← root builder page, three-column layout
    layout.tsx                      ← dark background, fonts
    globals.css                     ← Tailwind base styles
  components/
    controls/
      PrimitiveSelector.tsx         ← multi-select toggles for 8 primitive types
      PaletteSelector.tsx           ← palette swatch picker
      DensityControls.tsx           ← count + complexity sliders
    base-image/
      BaseImageSVG.tsx              ← renders PrimitiveDescriptor[] as SVG React elements
      TriangleSelector.tsx          ← SVG polygon overlay, drag + control buttons
    kaleidoscope/
      KaleidoscopeCanvas.tsx        ← HTML canvas, exposes imperative render method
      SectorControls.tsx            ← sector count slider + flip toggle
  lib/
    primitives/
      types.ts                      ← PrimitiveConfig, PrimitiveDescriptor, all shared types
      random.ts                     ← seeded PRNG (mulberry32)
      circles.ts                    ← generateCircles()
      concentricCircles.ts          ← generateConcentricCircles()
      spirals.ts                    ← generateSpirals()
      zigzags.ts                    ← generateZigzags()
      lines.ts                      ← generateLines()
      dots.ts                       ← generateDots()
      polygons.ts                   ← generatePolygons()
      sines.ts                      ← generateSines()
      index.ts                      ← maps PrimitiveType → generator function
    palette.ts                      ← PALETTES constant, Palette type
    generateImage.ts                ← orchestrates primitive placement
    kaleidoscope.ts                 ← canvas rendering algorithm
tests/
  lib/
    primitives/
      random.test.ts
      circles.test.ts
      concentricCircles.test.ts
      spirals.test.ts
      zigzags.test.ts
      lines.test.ts
      dots.test.ts
      polygons.test.ts
      sines.test.ts
    palette.test.ts
    generateImage.test.ts
    kaleidoscope.test.ts
```

---

## Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/eugenebakaev/Development/kaleidoscope-generator
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-turbopack --import-alias "@/*" --yes
```

- [ ] **Step 2: Install Vitest and React Testing Library**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Create vitest.setup.ts**

```ts
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

Add to the `scripts` section:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 6: Update src/app/layout.tsx for dark theme**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kaleidoscope Generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Verify setup**

```bash
npm run test:run
```
Expected: "No test files found" (exit 0 or vitest exits cleanly — no errors)

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "feat: initialize Next.js project with Tailwind and Vitest"
```

---

## Task 2: Seeded random + core types

**Files:**
- Create: `src/lib/primitives/types.ts`
- Create: `src/lib/primitives/random.ts`
- Create: `tests/lib/primitives/random.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- tests/lib/primitives/random.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create types.ts**

```ts
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
```

- [ ] **Step 4: Create random.ts**

```ts
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

  next.pick = <T>(arr: T[]): T => arr[next.randInt(0, arr.length)]

  return next
}
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run -- tests/lib/primitives/random.test.ts
```
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/primitives/types.ts src/lib/primitives/random.ts tests/lib/primitives/random.test.ts
git commit -m "feat: add seeded PRNG and primitive descriptor types"
```

---

## Task 3: Palette definitions

**Files:**
- Create: `src/lib/palette.ts`
- Create: `tests/lib/palette.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/palette.test.ts
import { describe, it, expect } from 'vitest'
import { PALETTES, getDarkestColor } from '@/lib/palette'

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

describe('getDarkestColor', () => {
  it('returns the darkest hex color from the palette', () => {
    const dark = getDarkestColor(['#ffffff', '#000000', '#888888'])
    expect(dark).toBe('#000000')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- tests/lib/palette.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create palette.ts**

```ts
// src/lib/palette.ts

export interface Palette {
  id: string
  name: string
  colors: string[]  // 5–6 hex strings, from light to dark
}

export const PALETTES: Palette[] = [
  {
    id: 'cosmic',
    name: 'Cosmic',
    colors: ['#e0aaff', '#c77dff', '#9d4edd', '#7b2d8b', '#560bad', '#3a0ca3'],
  },
  {
    id: 'ember',
    name: 'Ember',
    colors: ['#ffdd99', '#ffb347', '#ff6b35', '#e63946', '#9d0208', '#6a040f'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: ['#caf0f8', '#90e0ef', '#00b4d8', '#0077b6', '#03045e', '#023e8a'],
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: ['#d8f3dc', '#95d5b2', '#52b788', '#2d6a4f', '#1b4332', '#081c15'],
  },
  {
    id: 'dusk',
    name: 'Dusk',
    colors: ['#ffd6ff', '#e7c6ff', '#c8b6ff', '#b8c0ff', '#bbd0ff', '#98c1d9'],
  },
  {
    id: 'neon',
    name: 'Neon',
    colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3'],
  },
  {
    id: 'gold',
    name: 'Gold',
    colors: ['#fff3b0', '#fee440', '#f5a623', '#e07000', '#9c4a00', '#4a2000'],
  },
]

/** Returns the hex color with the lowest perceived luminance. */
export function getDarkestColor(colors: string[]): string {
  return colors.reduce((darkest, color) => {
    return luminance(color) < luminance(darkest) ? color : darkest
  })
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/lib/palette.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/palette.ts tests/lib/palette.test.ts
git commit -m "feat: add palette definitions and getDarkestColor utility"
```

---

## Task 4: Primitive generators — circles, dots, lines

**Files:**
- Create: `src/lib/primitives/circles.ts`
- Create: `src/lib/primitives/dots.ts`
- Create: `src/lib/primitives/lines.ts`
- Create: `tests/lib/primitives/circles.test.ts`
- Create: `tests/lib/primitives/dots.test.ts`
- Create: `tests/lib/primitives/lines.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/primitives/circles.test.ts
import { describe, it, expect } from 'vitest'
import { generateCircles } from '@/lib/primitives/circles'
import { createRandom } from '@/lib/primitives/random'

const config = {
  palette: ['#ff0000', '#00ff00', '#0000ff'],
  bounds: { width: 500, height: 500 },
  rng: createRandom(1),
  complexity: 0.5,
}

describe('generateCircles', () => {
  it('returns an array of circle descriptors', () => {
    const result = generateCircles(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('circle')
      expect(typeof d.cx).toBe('number')
      expect(typeof d.cy).toBe('number')
      expect(d.r).toBeGreaterThan(0)
      expect(config.palette).toContain(d.fill === 'none' ? d.stroke : d.fill)
    }
  })

  it('keeps circles within reasonable bounds', () => {
    const result = generateCircles(config)
    for (const d of result) {
      expect(d.cx).toBeGreaterThanOrEqual(0)
      expect(d.cx).toBeLessThanOrEqual(config.bounds.width)
      expect(d.cy).toBeGreaterThanOrEqual(0)
      expect(d.cy).toBeLessThanOrEqual(config.bounds.height)
    }
  })
})
```

```ts
// tests/lib/primitives/dots.test.ts
import { describe, it, expect } from 'vitest'
import { generateDots } from '@/lib/primitives/dots'
import { createRandom } from '@/lib/primitives/random'

const config = {
  palette: ['#ff0000', '#00ff00', '#0000ff'],
  bounds: { width: 500, height: 500 },
  rng: createRandom(2),
  complexity: 0.5,
}

describe('generateDots', () => {
  it('returns circle descriptors with small radii', () => {
    const result = generateDots(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('circle')
      expect(d.r).toBeLessThanOrEqual(10)
    }
  })
})
```

```ts
// tests/lib/primitives/lines.test.ts
import { describe, it, expect } from 'vitest'
import { generateLines } from '@/lib/primitives/lines'
import { createRandom } from '@/lib/primitives/random'

const config = {
  palette: ['#ff0000', '#00ff00', '#0000ff'],
  bounds: { width: 500, height: 500 },
  rng: createRandom(3),
  complexity: 0.5,
}

describe('generateLines', () => {
  it('returns line descriptors', () => {
    const result = generateLines(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('line')
      expect(typeof d.x1).toBe('number')
      expect(typeof d.y1).toBe('number')
      expect(typeof d.x2).toBe('number')
      expect(typeof d.y2).toBe('number')
    }
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run -- tests/lib/primitives/circles.test.ts tests/lib/primitives/dots.test.ts tests/lib/primitives/lines.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create circles.ts**

```ts
// src/lib/primitives/circles.ts
import type { PrimitiveConfig, CircleDescriptor } from './types'

export function generateCircles(config: PrimitiveConfig): CircleDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(3 + complexity * 7)  // 3–10 circles
  const result: CircleDescriptor[] = []

  for (let i = 0; i < count; i++) {
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const r = 10 + rng() * (30 + complexity * 60)
    const color = rng.pick(palette)
    const useStroke = rng() > 0.5

    result.push({
      tag: 'circle',
      cx, cy, r,
      fill: useStroke ? 'none' : color,
      stroke: useStroke ? color : 'none',
      strokeWidth: useStroke ? 1 + rng() * 3 : 0,
      opacity: 0.4 + rng() * 0.6,
    })
  }

  return result
}
```

- [ ] **Step 4: Create dots.ts**

```ts
// src/lib/primitives/dots.ts
import type { PrimitiveConfig, CircleDescriptor } from './types'

export function generateDots(config: PrimitiveConfig): CircleDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(10 + complexity * 30)  // 10–40 dots

  return Array.from({ length: count }, () => ({
    tag: 'circle' as const,
    cx: rng() * bounds.width,
    cy: rng() * bounds.height,
    r: 2 + rng() * 8,
    fill: rng.pick(palette),
    stroke: 'none',
    strokeWidth: 0,
    opacity: 0.5 + rng() * 0.5,
  }))
}
```

- [ ] **Step 5: Create lines.ts**

```ts
// src/lib/primitives/lines.ts
import type { PrimitiveConfig, LineDescriptor } from './types'

export function generateLines(config: PrimitiveConfig): LineDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(3 + complexity * 10)

  return Array.from({ length: count }, () => {
    const x1 = rng() * bounds.width
    const y1 = rng() * bounds.height
    const angle = rng() * Math.PI * 2
    const length = 40 + rng() * (bounds.width * 0.5)
    return {
      tag: 'line' as const,
      x1, y1,
      x2: x1 + Math.cos(angle) * length,
      y2: y1 + Math.sin(angle) * length,
      stroke: rng.pick(palette),
      strokeWidth: 1 + rng() * 3,
      opacity: 0.4 + rng() * 0.6,
    }
  })
}
```

- [ ] **Step 6: Run tests**

```bash
npm run test:run -- tests/lib/primitives/circles.test.ts tests/lib/primitives/dots.test.ts tests/lib/primitives/lines.test.ts
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/primitives/circles.ts src/lib/primitives/dots.ts src/lib/primitives/lines.ts tests/lib/primitives/circles.test.ts tests/lib/primitives/dots.test.ts tests/lib/primitives/lines.test.ts
git commit -m "feat: add circles, dots, and lines primitive generators"
```

---

## Task 5: Primitive generators — concentric circles, polygons, zigzags, spirals, sines

**Files:**
- Create: `src/lib/primitives/concentricCircles.ts`
- Create: `src/lib/primitives/polygons.ts`
- Create: `src/lib/primitives/zigzags.ts`
- Create: `src/lib/primitives/spirals.ts`
- Create: `src/lib/primitives/sines.ts`
- Create: tests for each

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/primitives/concentricCircles.test.ts
import { describe, it, expect } from 'vitest'
import { generateConcentricCircles } from '@/lib/primitives/concentricCircles'
import { createRandom } from '@/lib/primitives/random'

describe('generateConcentricCircles', () => {
  it('returns multiple circles sharing the same center', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(10), complexity: 0.5 }
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
```

```ts
// tests/lib/primitives/polygons.test.ts
import { describe, it, expect } from 'vitest'
import { generatePolygons } from '@/lib/primitives/polygons'
import { createRandom } from '@/lib/primitives/random'

describe('generatePolygons', () => {
  it('returns polygon descriptors', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(11), complexity: 0.5 }
    const result = generatePolygons(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('polygon')
      expect(typeof d.points).toBe('string')
      expect(d.points.length).toBeGreaterThan(0)
    }
  })
})
```

```ts
// tests/lib/primitives/zigzags.test.ts
import { describe, it, expect } from 'vitest'
import { generateZigzags } from '@/lib/primitives/zigzags'
import { createRandom } from '@/lib/primitives/random'

describe('generateZigzags', () => {
  it('returns polyline descriptors', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(12), complexity: 0.5 }
    const result = generateZigzags(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('polyline')
    }
  })
})
```

```ts
// tests/lib/primitives/spirals.test.ts
import { describe, it, expect } from 'vitest'
import { generateSpirals } from '@/lib/primitives/spirals'
import { createRandom } from '@/lib/primitives/random'

describe('generateSpirals', () => {
  it('returns path descriptors', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(13), complexity: 0.5 }
    const result = generateSpirals(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('path')
      expect(d.d.startsWith('M')).toBe(true)
    }
  })
})
```

```ts
// tests/lib/primitives/sines.test.ts
import { describe, it, expect } from 'vitest'
import { generateSines } from '@/lib/primitives/sines'
import { createRandom } from '@/lib/primitives/random'

describe('generateSines', () => {
  it('returns path descriptors', () => {
    const config = { palette: ['#ff0000', '#00ff00'], bounds: { width: 500, height: 500 }, rng: createRandom(14), complexity: 0.5 }
    const result = generateSines(config)
    expect(result.length).toBeGreaterThan(0)
    for (const d of result) {
      expect(d.tag).toBe('path')
    }
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run -- tests/lib/primitives/concentricCircles.test.ts tests/lib/primitives/polygons.test.ts tests/lib/primitives/zigzags.test.ts tests/lib/primitives/spirals.test.ts tests/lib/primitives/sines.test.ts
```
Expected: FAIL — modules not found

- [ ] **Step 3: Create concentricCircles.ts**

```ts
// src/lib/primitives/concentricCircles.ts
import type { PrimitiveConfig, CircleDescriptor } from './types'

export function generateConcentricCircles(config: PrimitiveConfig): CircleDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const groupCount = Math.round(1 + complexity * 3)  // 1–4 groups
  const result: CircleDescriptor[] = []

  for (let g = 0; g < groupCount; g++) {
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const ringCount = Math.round(2 + complexity * 4)  // 2–6 rings
    const maxR = 20 + rng() * 60

    for (let i = ringCount; i >= 1; i--) {
      const r = (maxR / ringCount) * i
      const color = rng.pick(palette)
      result.push({
        tag: 'circle',
        cx, cy, r,
        fill: 'none',
        stroke: color,
        strokeWidth: 1 + rng() * 2,
        opacity: 0.5 + rng() * 0.5,
      })
    }
  }

  return result
}
```

- [ ] **Step 4: Create polygons.ts**

```ts
// src/lib/primitives/polygons.ts
import type { PrimitiveConfig, PolygonDescriptor } from './types'

export function generatePolygons(config: PrimitiveConfig): PolygonDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(2 + complexity * 6)

  return Array.from({ length: count }, () => {
    const sides = rng.randInt(3, 6)  // 3, 4, or 5 sides
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const r = 15 + rng() * 50
    const rotation = rng() * Math.PI * 2
    const color = rng.pick(palette)
    const useStroke = rng() > 0.4

    const pts = Array.from({ length: sides }, (_, i) => {
      const angle = rotation + (i / sides) * Math.PI * 2
      return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`
    }).join(' ')

    return {
      tag: 'polygon' as const,
      points: pts,
      fill: useStroke ? 'none' : color,
      stroke: useStroke ? color : 'none',
      strokeWidth: useStroke ? 1 + rng() * 2 : 0,
      opacity: 0.4 + rng() * 0.6,
    }
  })
}
```

- [ ] **Step 5: Create zigzags.ts**

```ts
// src/lib/primitives/zigzags.ts
import type { PrimitiveConfig, PolylineDescriptor } from './types'

export function generateZigzags(config: PrimitiveConfig): PolylineDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(1 + complexity * 3)

  return Array.from({ length: count }, () => {
    const startX = rng() * bounds.width * 0.5
    const y = rng() * bounds.height
    const steps = Math.round(4 + complexity * 8)
    const stepW = (bounds.width * 0.6) / steps
    const amplitude = 10 + rng() * (20 + complexity * 40)

    const pts = Array.from({ length: steps + 1 }, (_, i) => {
      const x = startX + i * stepW
      const dy = i % 2 === 0 ? -amplitude : amplitude
      return `${x},${y + dy}`
    }).join(' ')

    return {
      tag: 'polyline' as const,
      points: pts,
      stroke: rng.pick(palette),
      strokeWidth: 1 + rng() * 3,
      fill: 'none',
      opacity: 0.5 + rng() * 0.5,
    }
  })
}
```

- [ ] **Step 6: Create spirals.ts**

```ts
// src/lib/primitives/spirals.ts
import type { PrimitiveConfig, PathDescriptor } from './types'

export function generateSpirals(config: PrimitiveConfig): PathDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(1 + complexity * 2)

  return Array.from({ length: count }, () => {
    const cx = rng() * bounds.width
    const cy = rng() * bounds.height
    const turns = 2 + Math.round(complexity * 3)  // 2–5 turns
    const maxR = 20 + rng() * 60
    const steps = turns * 24
    const color = rng.pick(palette)

    let d = ''
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const angle = t * turns * Math.PI * 2
      const r = t * maxR
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    }

    return {
      tag: 'path' as const,
      d,
      fill: 'none',
      stroke: color,
      strokeWidth: 1 + rng() * 2,
      opacity: 0.5 + rng() * 0.5,
    }
  })
}
```

- [ ] **Step 7: Create sines.ts**

```ts
// src/lib/primitives/sines.ts
import type { PrimitiveConfig, PathDescriptor } from './types'

export function generateSines(config: PrimitiveConfig): PathDescriptor[] {
  const { palette, bounds, rng, complexity } = config
  const count = Math.round(1 + complexity * 3)

  return Array.from({ length: count }, () => {
    const y0 = rng() * bounds.height
    const amplitude = 15 + rng() * (20 + complexity * 40)
    const frequency = 1 + rng() * (1 + complexity * 2)
    const steps = 60
    const color = rng.pick(palette)

    let d = ''
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * bounds.width
      const y = y0 + Math.sin((i / steps) * Math.PI * 2 * frequency) * amplitude
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    }

    return {
      tag: 'path' as const,
      d,
      fill: 'none',
      stroke: color,
      strokeWidth: 1 + rng() * 3,
      opacity: 0.5 + rng() * 0.5,
    }
  })
}
```

- [ ] **Step 8: Run all primitive tests**

```bash
npm run test:run -- tests/lib/primitives/
```
Expected: PASS (all primitive tests)

- [ ] **Step 9: Commit**

```bash
git add src/lib/primitives/ tests/lib/primitives/
git commit -m "feat: add all 8 primitive generators"
```

---

## Task 6: Primitive index + generateImage orchestrator

**Files:**
- Create: `src/lib/primitives/index.ts`
- Create: `src/lib/generateImage.ts`
- Create: `tests/lib/generateImage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/generateImage.test.ts
import { describe, it, expect } from 'vitest'
import { generateImage } from '@/lib/generateImage'
import { PALETTES } from '@/lib/palette'

const config = {
  enabledTypes: ['circles', 'dots', 'lines'] as const,
  palette: PALETTES[0],
  count: 10,
  complexity: 0.5,
  seed: 42,
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
      expect(d.r).toBeLessThanOrEqual(10)
    }
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- tests/lib/generateImage.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create src/lib/primitives/index.ts**

```ts
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
```

- [ ] **Step 4: Create src/lib/generateImage.ts**

```ts
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
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run -- tests/lib/generateImage.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/primitives/index.ts src/lib/generateImage.ts tests/lib/generateImage.test.ts
git commit -m "feat: add primitive index and generateImage orchestrator"
```

---

## Task 7: Kaleidoscope rendering algorithm

**Files:**
- Create: `src/lib/kaleidoscope.ts`
- Create: `tests/lib/kaleidoscope.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/kaleidoscope.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderKaleidoscope } from '@/lib/kaleidoscope'

// Mock canvas and context
const mockCtx = {
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  drawImage: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  clip: vi.fn(),
}

const mockCanvas = {
  width: 500,
  height: 500,
  getContext: vi.fn().mockReturnValue(mockCtx),
} as unknown as HTMLCanvasElement

const mockOffscreen = {
  width: 500,
  height: 500,
} as HTMLCanvasElement

describe('renderKaleidoscope', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls clearRect once', () => {
    renderKaleidoscope({
      canvas: mockCanvas,
      offscreenCanvas: mockOffscreen,
      triangle: { cx: 250, cy: 250, angle: 0, size: 100 },
      sectors: 6,
      flip: false,
    })
    expect(mockCtx.clearRect).toHaveBeenCalledTimes(1)
  })

  it('calls save/restore N times for N sectors', () => {
    renderKaleidoscope({
      canvas: mockCanvas,
      offscreenCanvas: mockOffscreen,
      triangle: { cx: 250, cy: 250, angle: 0, size: 100 },
      sectors: 8,
      flip: false,
    })
    expect(mockCtx.save).toHaveBeenCalledTimes(8)
    expect(mockCtx.restore).toHaveBeenCalledTimes(8)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- tests/lib/kaleidoscope.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create src/lib/kaleidoscope.ts**

```ts
// src/lib/kaleidoscope.ts

export interface TriangleState {
  cx: number    // center x in SVG coordinate space (0–500)
  cy: number    // center y in SVG coordinate space (0–500)
  angle: number // rotation in radians
  size: number  // distance from center to tip in SVG units
}

export interface KaleidoscopeOptions {
  canvas: HTMLCanvasElement
  offscreenCanvas: HTMLCanvasElement   // has the rasterized SVG drawn into it
  triangle: TriangleState
  sectors: number
  flip: boolean
}

/**
 * Renders the kaleidoscope onto `canvas` using the rasterized base image
 * from `offscreenCanvas` and the triangle selector state.
 */
export function renderKaleidoscope(opts: KaleidoscopeOptions): void {
  const { canvas, offscreenCanvas, triangle, sectors, flip } = opts
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width
  const H = canvas.height
  const cx = W / 2
  const cy = H / 2

  ctx.clearRect(0, 0, W, H)

  // Scale factor from SVG coordinate space (500×500) to canvas space
  const scaleX = offscreenCanvas.width / 500
  const scaleY = offscreenCanvas.height / 500

  // Triangle vertices in offscreen canvas pixel space
  const v = triangleVertices(triangle, scaleX, scaleY)

  for (let i = 0; i < sectors; i++) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((i / sectors) * Math.PI * 2)
    if (flip && i % 2 === 1) {
      ctx.scale(-1, 1)
    }

    // Clip to triangle path (centered at origin)
    ctx.beginPath()
    ctx.moveTo(v[0].x - cx, v[0].y - cy)
    ctx.lineTo(v[1].x - cx, v[1].y - cy)
    ctx.lineTo(v[2].x - cx, v[2].y - cy)
    ctx.closePath()
    ctx.clip()

    // Draw the offscreen canvas shifted so triangle center aligns with origin
    ctx.drawImage(offscreenCanvas, -triangle.cx * scaleX, -triangle.cy * scaleY)

    ctx.restore()
  }
}

function triangleVertices(
  t: TriangleState,
  scaleX: number,
  scaleY: number
): { x: number; y: number }[] {
  const angles = [t.angle, t.angle + (Math.PI * 2) / 3, t.angle + (Math.PI * 4) / 3]
  return angles.map(a => ({
    x: t.cx * scaleX + Math.cos(a) * t.size * scaleX,
    y: t.cy * scaleY + Math.sin(a) * t.size * scaleY,
  }))
}

/**
 * Rasterizes an SVG string into an offscreen canvas.
 * Returns a Promise that resolves with the canvas.
 */
export async function rasterizeSVG(svgString: string, width: number, height: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = reject
    img.src = url
  })
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/lib/kaleidoscope.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/kaleidoscope.ts tests/lib/kaleidoscope.test.ts
git commit -m "feat: add kaleidoscope rendering algorithm"
```

---

## Task 8: BaseImageSVG component

**Files:**
- Create: `src/components/base-image/BaseImageSVG.tsx`
- Create: `tests/components/base-image/BaseImageSVG.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/base-image/BaseImageSVG.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BaseImageSVG } from '@/components/base-image/BaseImageSVG'
import type { PrimitiveDescriptor } from '@/lib/primitives/types'

const descriptors: PrimitiveDescriptor[] = [
  { tag: 'circle', cx: 100, cy: 100, r: 30, fill: '#ff0000', stroke: 'none', strokeWidth: 0, opacity: 0.8 },
  { tag: 'line', x1: 0, y1: 0, x2: 100, y2: 100, stroke: '#00ff00', strokeWidth: 2, opacity: 1 },
]

describe('BaseImageSVG', () => {
  it('renders an SVG element', () => {
    const { container } = render(
      <BaseImageSVG descriptors={descriptors} background="#111111" svgRef={null} />
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders a rect for background', () => {
    const { container } = render(
      <BaseImageSVG descriptors={descriptors} background="#111111" svgRef={null} />
    )
    const rect = container.querySelector('rect')
    expect(rect?.getAttribute('fill')).toBe('#111111')
  })

  it('renders each descriptor', () => {
    const { container } = render(
      <BaseImageSVG descriptors={descriptors} background="#111111" svgRef={null} />
    )
    expect(container.querySelector('circle')).not.toBeNull()
    expect(container.querySelector('line')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- tests/components/base-image/BaseImageSVG.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 3: Create BaseImageSVG.tsx**

```tsx
// src/components/base-image/BaseImageSVG.tsx
import React from 'react'
import type { PrimitiveDescriptor } from '@/lib/primitives/types'

interface Props {
  descriptors: PrimitiveDescriptor[]
  background: string
  svgRef: React.Ref<SVGSVGElement> | null
}

export function BaseImageSVG({ descriptors, background, svgRef }: Props) {
  return (
    <svg
      ref={svgRef ?? undefined}
      viewBox="0 0 500 500"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="500" height="500" fill={background} />
      {descriptors.map((d, i) => renderDescriptor(d, i))}
    </svg>
  )
}

function renderDescriptor(d: PrimitiveDescriptor, key: number): React.ReactElement {
  switch (d.tag) {
    case 'circle':
      return <circle key={key} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} stroke={d.stroke} strokeWidth={d.strokeWidth} opacity={d.opacity} />
    case 'line':
      return <line key={key} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={d.stroke} strokeWidth={d.strokeWidth} opacity={d.opacity} />
    case 'polyline':
      return <polyline key={key} points={d.points} stroke={d.stroke} strokeWidth={d.strokeWidth} fill={d.fill} opacity={d.opacity} />
    case 'polygon':
      return <polygon key={key} points={d.points} fill={d.fill} stroke={d.stroke} strokeWidth={d.strokeWidth} opacity={d.opacity} />
    case 'path':
      return <path key={key} d={d.d} fill={d.fill} stroke={d.stroke} strokeWidth={d.strokeWidth} opacity={d.opacity} />
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/components/base-image/BaseImageSVG.test.tsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/base-image/BaseImageSVG.tsx tests/components/base-image/BaseImageSVG.test.tsx
git commit -m "feat: add BaseImageSVG component"
```

---

## Task 9: TriangleSelector component

**Files:**
- Create: `src/components/base-image/TriangleSelector.tsx`
- Create: `tests/components/base-image/TriangleSelector.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/base-image/TriangleSelector.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TriangleSelector } from '@/components/base-image/TriangleSelector'

const defaultState = { cx: 250, cy: 250, angle: 0, size: 100 }

describe('TriangleSelector', () => {
  it('renders an SVG polygon overlay', () => {
    const { container } = render(
      <TriangleSelector state={defaultState} onChange={vi.fn()} svgSize={500} />
    )
    expect(container.querySelector('polygon')).not.toBeNull()
  })

  it('calls onChange with updated cx/cy on move button click', () => {
    const onChange = vi.fn()
    const { getByTitle } = render(
      <TriangleSelector state={defaultState} onChange={onChange} svgSize={500} />
    )
    fireEvent.click(getByTitle('Move up'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ cy: defaultState.cy - 5 }))
  })

  it('calls onChange with updated angle on rotate button click', () => {
    const onChange = vi.fn()
    const { getByTitle } = render(
      <TriangleSelector state={defaultState} onChange={onChange} svgSize={500} />
    )
    fireEvent.click(getByTitle('Rotate clockwise'))
    const updatedAngle = onChange.mock.calls[0][0].angle
    expect(updatedAngle).toBeCloseTo(defaultState.angle + (5 * Math.PI) / 180, 5)
  })

  it('calls onChange with updated size on scale button click', () => {
    const onChange = vi.fn()
    const { getByTitle } = render(
      <TriangleSelector state={defaultState} onChange={onChange} svgSize={500} />
    )
    fireEvent.click(getByTitle('Scale up'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ size: defaultState.size * 1.1 }))
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- tests/components/base-image/TriangleSelector.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 3: Create TriangleSelector.tsx**

```tsx
// src/components/base-image/TriangleSelector.tsx
'use client'
import React, { useRef, useCallback } from 'react'
import type { TriangleState } from '@/lib/kaleidoscope'

interface Props {
  state: TriangleState
  onChange: (next: TriangleState) => void
  svgSize: number   // side length of the SVG viewBox (500)
}

const MOVE_STEP = 5
const ROTATE_STEP = (5 * Math.PI) / 180
const SCALE_FACTOR = 0.1

export function TriangleSelector({ state, onChange, svgSize }: Props) {
  const { cx, cy, angle, size } = state
  const isDragging = useRef(false)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const vertices = triangleVertices(cx, cy, angle, size)
  const points = vertices.map(v => `${v.x},${v.y}`).join(' ')

  const svgPoint = useCallback((e: React.PointerEvent): { x: number; y: number } | null => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const scaleX = svgSize / rect.width
    const scaleY = svgSize / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [svgSize])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const pt = svgPoint(e)
    if (!pt) return
    onChange({ ...state, cx: pt.x, cy: pt.y })
  }

  const onPointerUp = () => { isDragging.current = false }

  return (
    <div className="flex flex-col gap-2">
      {/* SVG overlay — rendered inside the parent SVG via foreignObject isn't ideal;
          instead this component renders its own SVG that is absolutely positioned over BaseImageSVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <polygon
          points={points}
          fill="rgba(255,215,0,0.08)"
          stroke="#ffd700"
          strokeWidth="2"
          strokeDasharray="6 3"
          style={{ pointerEvents: 'all', cursor: 'move' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </svg>

      {/* Control buttons */}
      <div className="flex gap-1 justify-center flex-wrap">
        <button title="Move left"  onClick={() => onChange({ ...state, cx: cx - MOVE_STEP })} className="control-btn">←</button>
        <button title="Move right" onClick={() => onChange({ ...state, cx: cx + MOVE_STEP })} className="control-btn">→</button>
        <button title="Move up"    onClick={() => onChange({ ...state, cy: cy - MOVE_STEP })} className="control-btn">↑</button>
        <button title="Move down"  onClick={() => onChange({ ...state, cy: cy + MOVE_STEP })} className="control-btn">↓</button>
        <button title="Rotate counter-clockwise" onClick={() => onChange({ ...state, angle: angle - ROTATE_STEP })} className="control-btn">↺</button>
        <button title="Rotate clockwise"         onClick={() => onChange({ ...state, angle: angle + ROTATE_STEP })} className="control-btn">↻</button>
        <button title="Scale down" onClick={() => onChange({ ...state, size: size * (1 - SCALE_FACTOR) })} className="control-btn">−</button>
        <button title="Scale up"   onClick={() => onChange({ ...state, size: size * (1 + SCALE_FACTOR) })} className="control-btn">+</button>
      </div>
    </div>
  )
}

function triangleVertices(cx: number, cy: number, angle: number, size: number) {
  return [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map(offset => ({
    x: cx + Math.cos(angle + offset) * size,
    y: cy + Math.sin(angle + offset) * size,
  }))
}
```

- [ ] **Step 4: Add `control-btn` utility to globals.css**

Add at the end of `src/app/globals.css`:
```css
@layer components {
  .control-btn {
    @apply bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2 py-1 rounded text-sm font-mono transition-colors;
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run -- tests/components/base-image/TriangleSelector.test.tsx
```
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/base-image/TriangleSelector.tsx tests/components/base-image/TriangleSelector.test.tsx src/app/globals.css
git commit -m "feat: add TriangleSelector component with drag and control buttons"
```

---

## Task 10: KaleidoscopeCanvas component

**Files:**
- Create: `src/components/kaleidoscope/KaleidoscopeCanvas.tsx`
- Create: `tests/components/kaleidoscope/KaleidoscopeCanvas.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/kaleidoscope/KaleidoscopeCanvas.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { KaleidoscopeCanvas } from '@/components/kaleidoscope/KaleidoscopeCanvas'

describe('KaleidoscopeCanvas', () => {
  it('renders a canvas element', () => {
    const { container } = render(<KaleidoscopeCanvas ref={null} />)
    expect(container.querySelector('canvas')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- tests/components/kaleidoscope/KaleidoscopeCanvas.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 3: Create KaleidoscopeCanvas.tsx**

```tsx
// src/components/kaleidoscope/KaleidoscopeCanvas.tsx
'use client'
import React, { forwardRef } from 'react'

export const KaleidoscopeCanvas = forwardRef<HTMLCanvasElement>(
  function KaleidoscopeCanvas(_, ref) {
    return (
      <canvas
        ref={ref}
        width={500}
        height={500}
        className="w-full h-full object-contain rounded"
      />
    )
  }
)
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/components/kaleidoscope/KaleidoscopeCanvas.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/kaleidoscope/KaleidoscopeCanvas.tsx tests/components/kaleidoscope/KaleidoscopeCanvas.test.tsx
git commit -m "feat: add KaleidoscopeCanvas component"
```

---

## Task 11: Control panel components

**Files:**
- Create: `src/components/controls/PrimitiveSelector.tsx`
- Create: `src/components/controls/PaletteSelector.tsx`
- Create: `src/components/controls/DensityControls.tsx`
- Create: `src/components/kaleidoscope/SectorControls.tsx`
- Create: `tests/components/controls/PrimitiveSelector.test.tsx`
- Create: `tests/components/controls/PaletteSelector.test.tsx`
- Create: `tests/components/controls/DensityControls.test.tsx`
- Create: `tests/components/kaleidoscope/SectorControls.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// tests/components/controls/PrimitiveSelector.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PrimitiveSelector } from '@/components/controls/PrimitiveSelector'
import type { PrimitiveType } from '@/lib/primitives/types'

describe('PrimitiveSelector', () => {
  it('renders all 8 primitive types', () => {
    const { getAllByRole } = render(
      <PrimitiveSelector selected={['circles']} onChange={vi.fn()} />
    )
    expect(getAllByRole('checkbox').length).toBe(8)
  })

  it('calls onChange when a toggle is clicked', () => {
    const onChange = vi.fn()
    const { getAllByRole } = render(
      <PrimitiveSelector selected={['circles']} onChange={onChange} />
    )
    fireEvent.click(getAllByRole('checkbox')[1])
    expect(onChange).toHaveBeenCalled()
  })

  it('does not allow deselecting the last item', () => {
    const onChange = vi.fn()
    const { getAllByRole } = render(
      <PrimitiveSelector selected={['circles']} onChange={onChange} />
    )
    // Click the only selected checkbox (index 0 = circles)
    fireEvent.click(getAllByRole('checkbox')[0])
    expect(onChange).not.toHaveBeenCalled()
  })
})
```

```tsx
// tests/components/controls/PaletteSelector.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PaletteSelector } from '@/components/controls/PaletteSelector'
import { PALETTES } from '@/lib/palette'

describe('PaletteSelector', () => {
  it('renders a swatch for each palette', () => {
    const { getAllByRole } = render(
      <PaletteSelector selected={PALETTES[0]} onChange={vi.fn()} />
    )
    expect(getAllByRole('button').length).toBe(PALETTES.length)
  })

  it('calls onChange with the clicked palette', () => {
    const onChange = vi.fn()
    const { getAllByRole } = render(
      <PaletteSelector selected={PALETTES[0]} onChange={onChange} />
    )
    fireEvent.click(getAllByRole('button')[2])
    expect(onChange).toHaveBeenCalledWith(PALETTES[2])
  })
})
```

```tsx
// tests/components/controls/DensityControls.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { DensityControls } from '@/components/controls/DensityControls'

describe('DensityControls', () => {
  it('renders count and complexity sliders', () => {
    const { getAllByRole } = render(
      <DensityControls count={10} complexity={0.5} onCountChange={vi.fn()} onComplexityChange={vi.fn()} />
    )
    expect(getAllByRole('slider').length).toBe(2)
  })

  it('calls onCountChange when count slider changes', () => {
    const onCountChange = vi.fn()
    const { getAllByRole } = render(
      <DensityControls count={10} complexity={0.5} onCountChange={onCountChange} onComplexityChange={vi.fn()} />
    )
    fireEvent.change(getAllByRole('slider')[0], { target: { value: '20' } })
    expect(onCountChange).toHaveBeenCalledWith(20)
  })
})
```

```tsx
// tests/components/kaleidoscope/SectorControls.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SectorControls } from '@/components/kaleidoscope/SectorControls'

describe('SectorControls', () => {
  it('renders sector slider and flip toggle', () => {
    const { getByRole, getByLabelText } = render(
      <SectorControls sectors={6} flip={false} onSectorsChange={vi.fn()} onFlipChange={vi.fn()} />
    )
    expect(getByRole('slider')).not.toBeNull()
    expect(getByLabelText('Flip alternate sectors')).not.toBeNull()
  })

  it('calls onSectorsChange when slider changes', () => {
    const onSectorsChange = vi.fn()
    const { getByRole } = render(
      <SectorControls sectors={6} flip={false} onSectorsChange={onSectorsChange} onFlipChange={vi.fn()} />
    )
    fireEvent.change(getByRole('slider'), { target: { value: '12' } })
    expect(onSectorsChange).toHaveBeenCalledWith(12)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run -- tests/components/controls/ tests/components/kaleidoscope/SectorControls.test.tsx
```
Expected: FAIL — modules not found

- [ ] **Step 3: Create PrimitiveSelector.tsx**

```tsx
// src/components/controls/PrimitiveSelector.tsx
'use client'
import React from 'react'
import type { PrimitiveType } from '@/lib/primitives/types'

const ALL_TYPES: { type: PrimitiveType; label: string }[] = [
  { type: 'circles',           label: 'Circles' },
  { type: 'concentricCircles', label: 'Concentric' },
  { type: 'spirals',           label: 'Spirals' },
  { type: 'zigzags',           label: 'Zigzags' },
  { type: 'lines',             label: 'Lines' },
  { type: 'dots',              label: 'Dots' },
  { type: 'polygons',          label: 'Polygons' },
  { type: 'sines',             label: 'Sines' },
]

interface Props {
  selected: PrimitiveType[]
  onChange: (next: PrimitiveType[]) => void
}

export function PrimitiveSelector({ selected, onChange }: Props) {
  const toggle = (type: PrimitiveType) => {
    if (selected.includes(type)) {
      if (selected.length === 1) return  // keep at least one
      onChange(selected.filter(t => t !== type))
    } else {
      onChange([...selected, type])
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="label">Primitives</span>
      {ALL_TYPES.map(({ type, label }) => (
        <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-neutral-300 hover:text-white">
          <input
            type="checkbox"
            role="checkbox"
            checked={selected.includes(type)}
            onChange={() => toggle(type)}
            className="accent-violet-500"
          />
          {label}
        </label>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create PaletteSelector.tsx**

```tsx
// src/components/controls/PaletteSelector.tsx
'use client'
import React from 'react'
import { PALETTES, type Palette } from '@/lib/palette'

interface Props {
  selected: Palette
  onChange: (palette: Palette) => void
}

export function PaletteSelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label">Palette</span>
      <div className="flex flex-col gap-1.5">
        {PALETTES.map(palette => (
          <button
            key={palette.id}
            onClick={() => onChange(palette)}
            title={palette.name}
            className={`h-6 rounded flex overflow-hidden border-2 transition-colors ${
              selected.id === palette.id ? 'border-violet-400' : 'border-transparent'
            }`}
          >
            {palette.colors.map(color => (
              <div key={color} className="flex-1 h-full" style={{ background: color }} />
            ))}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create DensityControls.tsx**

```tsx
// src/components/controls/DensityControls.tsx
'use client'
import React from 'react'

interface Props {
  count: number
  complexity: number
  onCountChange: (v: number) => void
  onComplexityChange: (v: number) => void
}

export function DensityControls({ count, complexity, onCountChange, onComplexityChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="label flex justify-between">
          <span>Density</span>
          <span className="text-neutral-400">{count}</span>
        </label>
        <input
          type="range"
          role="slider"
          min={3}
          max={30}
          value={count}
          onChange={e => onCountChange(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="label flex justify-between">
          <span>Complexity</span>
          <span className="text-neutral-400">{Math.round(complexity * 100)}%</span>
        </label>
        <input
          type="range"
          role="slider"
          min={0}
          max={100}
          value={Math.round(complexity * 100)}
          onChange={e => onComplexityChange(Number(e.target.value) / 100)}
          className="w-full accent-violet-500"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create SectorControls.tsx**

```tsx
// src/components/kaleidoscope/SectorControls.tsx
'use client'
import React from 'react'

interface Props {
  sectors: number
  flip: boolean
  onSectorsChange: (v: number) => void
  onFlipChange: (v: boolean) => void
}

export function SectorControls({ sectors, flip, onSectorsChange, onFlipChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="label flex justify-between">
          <span>Sectors</span>
          <span className="text-neutral-400">{sectors}</span>
        </label>
        <input
          type="range"
          min={3}
          max={24}
          value={sectors}
          onChange={e => onSectorsChange(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
        <input
          type="checkbox"
          aria-label="Flip alternate sectors"
          checked={flip}
          onChange={e => onFlipChange(e.target.checked)}
          className="accent-violet-500"
        />
        Flip alternate sectors
      </label>
    </div>
  )
}
```

- [ ] **Step 7: Add `label` utility to globals.css**

```css
/* Add inside the @layer components block in src/app/globals.css */
.label {
  @apply text-xs text-neutral-400 uppercase tracking-wider font-medium;
}
```

- [ ] **Step 8: Run tests**

```bash
npm run test:run -- tests/components/controls/ tests/components/kaleidoscope/SectorControls.test.tsx
```
Expected: PASS (all tests)

- [ ] **Step 9: Commit**

```bash
git add src/components/controls/ src/components/kaleidoscope/SectorControls.tsx tests/components/ src/app/globals.css
git commit -m "feat: add control panel components (PrimitiveSelector, PaletteSelector, DensityControls, SectorControls)"
```

---

## Task 12: Builder page — wire everything together

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace src/app/page.tsx with the full builder page**

```tsx
// src/app/page.tsx
'use client'
import React, { useState, useRef, useCallback } from 'react'
import { PrimitiveSelector } from '@/components/controls/PrimitiveSelector'
import { PaletteSelector } from '@/components/controls/PaletteSelector'
import { DensityControls } from '@/components/controls/DensityControls'
import { BaseImageSVG } from '@/components/base-image/BaseImageSVG'
import { TriangleSelector } from '@/components/base-image/TriangleSelector'
import { KaleidoscopeCanvas } from '@/components/kaleidoscope/KaleidoscopeCanvas'
import { SectorControls } from '@/components/kaleidoscope/SectorControls'
import { generateImage } from '@/lib/generateImage'
import { renderKaleidoscope, rasterizeSVG, type TriangleState } from '@/lib/kaleidoscope'
import { PALETTES, getDarkestColor, type Palette } from '@/lib/palette'
import type { PrimitiveType, PrimitiveDescriptor } from '@/lib/primitives/types'
import { renderToStaticMarkup } from 'react-dom/server'

const SVG_SIZE = 500

const INITIAL_TRIANGLE: TriangleState = {
  cx: SVG_SIZE / 2,
  cy: SVG_SIZE / 2,
  angle: 0,
  size: SVG_SIZE * 0.3,
}

export default function BuilderPage() {
  const [enabledTypes, setEnabledTypes] = useState<PrimitiveType[]>(['circles', 'dots', 'lines', 'polygons'])
  const [palette, setPalette] = useState<Palette>(PALETTES[0])
  const [count, setCount] = useState(10)
  const [complexity, setComplexity] = useState(0.5)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff))
  const [descriptors, setDescriptors] = useState<PrimitiveDescriptor[]>(() =>
    generateImage({ enabledTypes: ['circles', 'dots', 'lines', 'polygons'], palette: PALETTES[0], count: 10, complexity: 0.5, seed: 1 })
  )
  const [triangle, setTriangle] = useState<TriangleState>(INITIAL_TRIANGLE)
  const [sectors, setSectors] = useState(6)
  const [flip, setFlip] = useState(true)
  const [isApplying, setIsApplying] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const background = getDarkestColor(palette.colors)

  const handleGenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 0xffffffff)
    setSeed(newSeed)
    setDescriptors(generateImage({ enabledTypes, palette, count, complexity, seed: newSeed }))
  }, [enabledTypes, palette, count, complexity])

  const handleApply = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsApplying(true)
    try {
      const svgElement = (
        <BaseImageSVG descriptors={descriptors} background={background} svgRef={null} />
      )
      const svgString = `<?xml version="1.0" encoding="UTF-8"?>${renderToStaticMarkup(svgElement)}`
      const offscreen = await rasterizeSVG(svgString, SVG_SIZE, SVG_SIZE)
      renderKaleidoscope({ canvas, offscreenCanvas: offscreen, triangle, sectors, flip })
    } finally {
      setIsApplying(false)
    }
  }, [descriptors, background, triangle, sectors, flip])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center px-6 py-3 border-b border-neutral-800">
        <h1 className="text-sm font-semibold tracking-widest text-neutral-300 uppercase">Kaleidoscope</h1>
      </header>

      {/* Three-column layout */}
      <div className="flex-1 grid grid-cols-[220px_1fr_1fr] overflow-hidden">

        {/* Left panel — controls */}
        <aside className="flex flex-col gap-6 p-4 border-r border-neutral-800 overflow-y-auto">
          <PrimitiveSelector selected={enabledTypes} onChange={setEnabledTypes} />
          <PaletteSelector selected={palette} onChange={setPalette} />
          <DensityControls
            count={count}
            complexity={complexity}
            onCountChange={setCount}
            onComplexityChange={setComplexity}
          />
          <button
            onClick={handleGenerate}
            className="mt-auto bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 rounded transition-colors"
          >
            Generate
          </button>
        </aside>

        {/* Center panel — base image + triangle selector */}
        <section className="flex flex-col p-4 border-r border-neutral-800 gap-3 overflow-hidden">
          <span className="label">Base Image</span>
          <div className="relative flex-1 bg-neutral-900 rounded overflow-hidden">
            <BaseImageSVG descriptors={descriptors} background={background} svgRef={svgRef} />
            <div className="absolute inset-0">
              <TriangleSelector state={triangle} onChange={setTriangle} svgSize={SVG_SIZE} />
            </div>
          </div>
        </section>

        {/* Right panel — kaleidoscope */}
        <section className="flex flex-col p-4 gap-3 overflow-hidden">
          <span className="label">Kaleidoscope</span>
          <div className="flex-1 bg-neutral-900 rounded overflow-hidden flex items-center justify-center">
            <KaleidoscopeCanvas ref={canvasRef} />
          </div>
          <SectorControls
            sectors={sectors}
            flip={flip}
            onSectorsChange={setSectors}
            onFlipChange={setFlip}
          />
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors"
          >
            {isApplying ? 'Rendering…' : 'Apply'}
          </button>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests to confirm nothing is broken**

```bash
npm run test:run
```
Expected: PASS (all tests)

- [ ] **Step 3: Start the dev server and verify in browser**

```bash
npm run dev
```
Open http://localhost:3000. Verify:
- Three-column layout renders
- Generate button produces a new base image
- Triangle overlay is visible and draggable
- Control buttons (move/rotate/scale) update the triangle
- Apply button renders the kaleidoscope

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble builder page, wire all components together"
```

---

## Self-Review Checklist

After writing this plan, checking it against the spec:

- [x] **Three-column layout** — Task 12
- [x] **8 primitive types** — Tasks 4 + 5, all listed in PrimitiveSelector
- [x] **Palette selection (~6 palettes)** — Task 3 (7 palettes defined), Task 11 PaletteSelector
- [x] **Density (count) + complexity sliders** — Task 11 DensityControls
- [x] **Generate button** — Task 12
- [x] **SVG base image rendering** — Task 8 BaseImageSVG
- [x] **Triangle selector: drag** — Task 9 TriangleSelector (pointerdown/move/up)
- [x] **Triangle selector: move/rotate/scale buttons** — Task 9 (5px move, 5° rotate, 10% scale)
- [x] **Sector count slider (3–24)** — Task 11 SectorControls
- [x] **Flip toggle** — Task 11 SectorControls
- [x] **Apply button** — Task 12
- [x] **SVG → Canvas rasterization** — Task 7 rasterizeSVG, Task 12 handleApply
- [x] **Kaleidoscope compositing (N sectors + flip)** — Task 7 renderKaleidoscope
- [x] **Seeded random (deterministic generation)** — Task 2
- [x] **Dark Figma-like UI, Tailwind** — Task 1 + layout.tsx + globals.css + Task 12 page.tsx
- [x] **`PrimitiveDescriptor` plain objects (not DOM elements)** — Task 2 types.ts, all generators return plain objects
- [x] **Triangle persists across Generate calls** — Task 12: only `descriptors` + `seed` change on Generate, `triangle` state untouched
