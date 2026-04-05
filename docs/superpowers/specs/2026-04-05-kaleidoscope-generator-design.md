# Kaleidoscope Generator — Design Spec

**Date:** 2026-04-05  
**Status:** Approved

---

## Overview

A browser-based kaleidoscope builder. Users generate a random SVG base image from geometric primitives, select a triangular region of it, and compose that region into a kaleidoscope pattern. The app is a single Next.js page with a three-column layout.

---

## Tech Stack

- **Framework:** Next.js (React, TypeScript)
- **Base image rendering:** SVG (inline, rendered as React elements)
- **Kaleidoscope rendering:** HTML Canvas 2D
- **State management:** React `useState` / `useReducer` — no external store
- **Styling:** Tailwind CSS (dark, minimal, tool-like UI — Figma aesthetic)

---

## Layout

Three-column layout on a single page (`/`):

```
┌─────────────────┬──────────────────────┬──────────────────────┐
│  Left Panel     │  Center Panel        │  Right Panel         │
│  (Controls)     │  (Base Image)        │  (Kaleidoscope)      │
│                 │                      │                      │
│  Primitives     │  SVG canvas          │  Canvas output       │
│  Palette        │  + triangle overlay  │                      │
│  Density        │  + control buttons   │  Sector controls     │
│  [Generate]     │                      │  [Apply]             │
└─────────────────┴──────────────────────┴──────────────────────┘
```

---

## Directory Structure

```
src/
  app/
    page.tsx                  ← builder page (root component)
    layout.tsx
  components/
    controls/
      PrimitiveSelector.tsx   ← multi-select toggles for primitive types
      PaletteSelector.tsx     ← palette swatch picker
      DensityControls.tsx     ← count + complexity sliders
    base-image/
      BaseImageSVG.tsx        ← SVG canvas with generated primitives
      TriangleSelector.tsx    ← draggable SVG overlay + control buttons
    kaleidoscope/
      KaleidoscopeCanvas.tsx  ← HTML canvas output
      SectorControls.tsx      ← sector count slider + flip toggle
  lib/
    primitives/
      circles.ts
      concentricCircles.ts
      spirals.ts
      zigzags.ts
      lines.ts
      dots.ts
      polygons.ts
      sines.ts
    palette.ts                ← predefined palettes (array of 5–6 hex colors each)
    generateImage.ts          ← orchestrates primitive placement with seeded random
    kaleidoscope.ts           ← canvas rendering algorithm
```

---

## Components & Data Flow

### Left Panel — Base Image Controls

**`PrimitiveSelector`**
- Multi-select toggles for 8 primitive types: circles, concentric circles, spirals, zigzags, lines, dots, polygons, sines
- At least one must remain selected at all times

**`PaletteSelector`**
- ~6 predefined color palettes displayed as horizontal swatches
- One palette active at a time

**`DensityControls`**
- **Count slider** — controls how many primitives are placed on the canvas
- **Complexity slider** — feeds per-generator params (spiral tightness, zigzag amplitude, polygon sides range, etc.)

**Generate button** — calls `generateImage()` with current config + new random seed, updates the SVG element tree

### Center Panel — Base Image

**`BaseImageSVG`**
- Renders an SVG element with a colored background (darkest shade of active palette) and all generated primitives
- Accepts the element tree produced by `generateImage()`

**`TriangleSelector`**
- SVG `<polygon>` overlay on top of `BaseImageSVG`
- Dashed gold stroke so it's visible over any palette
- State: `{ cx, cy, angle, size }` — all four values derive the three triangle vertices
- **Drag:** `pointerdown` on polygon → capture pointer → `pointermove` updates `cx, cy` → `pointerup` releases
- **Control buttons** below the canvas:
  ```
  [← ] [→ ] [↑ ] [↓ ]    Move (nudge 5px per click)
  [ ↺ ] [ ↻ ]            Rotate (5° per click)
  [ − ] [ + ]            Scale (10% per click)
  ```
- Initial state: centered on the SVG, `angle=0`, `size` ≈ 40% of canvas width

### Right Panel — Kaleidoscope

**`SectorControls`**
- Sector count slider (range 3–24, snaps to integers)
- Flip toggle — mirrors every other sector (classic kaleidoscope effect)

**`KaleidoscopeCanvas`**
- HTML `<canvas>` element, displays the composited kaleidoscope output

**Apply button** — triggers the full render pipeline

---

## Render Pipeline (`lib/kaleidoscope.ts`)

1. **Rasterize** — serialize `BaseImageSVG` to a Blob URL, draw into an offscreen `<canvas>` via `drawImage`
2. **Map triangle** — convert `{ cx, cy, angle, size }` from SVG coordinate space to canvas pixel coordinates (accounting for SVG viewBox → canvas pixel ratio)
3. **Clip sector** — extract the triangular pixel region from the offscreen canvas
4. **Compose** — for each of N sectors:
   - Rotate the canvas context by `(360 / N * i)°` around the output center
   - If flip is enabled, mirror every other sector (scale x by -1)
   - Draw the clipped triangle segment
5. **Display** — render result to the visible `KaleidoscopeCanvas`

---

## Primitive Generators (`lib/primitives/`)

Each file exports a function:

```ts
generateX(config: PrimitiveConfig): PrimitiveDescriptor[]
```

`PrimitiveConfig` contains: active palette, canvas bounding box, seeded random function.

`PrimitiveDescriptor` is a plain JS object describing an SVG element (tag name + attributes). `BaseImageSVG` maps these to React JSX. Using plain objects (not DOM elements) keeps generators framework-free and makes the SVG serializable via `renderToStaticMarkup` for the Canvas rasterization step.

| Primitive         | SVG element   | Notes                                              |
|-------------------|---------------|----------------------------------------------------|
| Circles           | `<circle>`    | Random radius, fill or stroke from palette         |
| Concentric circles| `<circle>` group | Same center point, stepped radii               |
| Spirals           | `<path>`      | Archimedean spiral via arc segments                |
| Zigzags           | `<polyline>`  | Random amplitude + frequency                       |
| Lines             | `<line>`      | Random angle and length                            |
| Dots              | `<circle>`    | Small filled circles scattered randomly            |
| Polygons          | `<polygon>`   | 3–5 sides, random rotation                        |
| Sines             | `<path>`      | Sine wave approximated as cubic bezier             |

`generateImage.ts` selects N primitives from the enabled types, calls each generator, and returns the full element tree. The density (count) slider controls N; the complexity slider feeds per-generator parameters.

---

## Palettes (`lib/palette.ts`)

- ~6 predefined palettes, each an array of 5–6 hex color strings
- Background color = darkest shade in the active palette
- Primitives randomly sample from the palette for fill and stroke colors

---

## Interaction Model

- **Generate** — always produces a new random base image (new seed); does not affect triangle selector state
- **Apply** — runs the kaleidoscope render pipeline with current triangle + sector settings; no live preview
- Triangle selector persists across Generate calls (position/angle/size not reset)

---

## Out of Scope (for now)

- Export to PNG or SVG
- Custom color pickers (palettes only)
- Saving / sharing / history
- Animation / live preview mode
