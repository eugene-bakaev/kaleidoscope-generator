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
    const svg = svgRef.current
    if (!canvas || !svg) return
    setIsApplying(true)
    try {
      const svgString = new XMLSerializer().serializeToString(svg)
      const offscreen = await rasterizeSVG(svgString, SVG_SIZE, SVG_SIZE)
      renderKaleidoscope({ canvas, offscreenCanvas: offscreen, triangle, sectors, flip })
    } finally {
      setIsApplying(false)
    }
  }, [triangle, sectors, flip])

  // suppress unused variable warning for seed
  void seed

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
