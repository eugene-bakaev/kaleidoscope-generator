'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { PrimitiveSelector } from '@/components/controls/PrimitiveSelector'
import { PaletteSelector } from '@/components/controls/PaletteSelector'
import { DensityControls } from '@/components/controls/DensityControls'
import { PaletteControls } from '@/components/controls/PaletteControls'
import { CollapsibleSection } from '@/components/controls/CollapsibleSection'
import { BaseImageSVG } from '@/components/base-image/BaseImageSVG'
import { TriangleSelector } from '@/components/base-image/TriangleSelector'
import { KaleidoscopeCanvas } from '@/components/kaleidoscope/KaleidoscopeCanvas'
import { SectorControls } from '@/components/kaleidoscope/SectorControls'
import { generateImage } from '@/lib/generateImage'
import { renderKaleidoscope, rasterizeSVG, type TriangleState } from '@/lib/kaleidoscope'
import { PALETTES, getLightestColor, generateFullRandomPalette, type Palette } from '@/lib/palette'
import type { PrimitiveType, PrimitiveDescriptor } from '@/lib/primitives/types'

const SVG_SIZE = 500
const INITIAL_SECTORS = 8
const ROTATE_STEP = (5 * Math.PI) / 180

const triangleSizeForSectors = (n: number) => (SVG_SIZE / 2) * Math.tan(Math.PI / n)

const INITIAL_TRIANGLE: TriangleState = {
  cx: SVG_SIZE / 2,
  cy: SVG_SIZE / 2,
  angle: 0,
  size: triangleSizeForSectors(INITIAL_SECTORS),
}

const ALL_TYPES: PrimitiveType[] = ['circles', 'concentricCircles', 'spirals', 'zigzags', 'lines', 'dots', 'polygons', 'sines']

export default function BuilderPage() {
  const [enabledTypes, setEnabledTypes] = useState<PrimitiveType[]>(['circles', 'dots', 'lines', 'polygons'])
  const [palette, setPalette] = useState<Palette>(PALETTES[0])
  const [count, setCount] = useState(10)
  const [complexity, setComplexity] = useState(0.5)
  const [opacityMin, setOpacityMin] = useState(0.4)
  const [opacityMax, setOpacityMax] = useState(1.0)
  const [seed, setSeed] = useState(1)
  const [descriptors, setDescriptors] = useState<PrimitiveDescriptor[]>(() =>
    generateImage({
      enabledTypes: ['circles', 'dots', 'lines', 'polygons'],
      palette: PALETTES[0],
      count: 10,
      complexity: 0.5,
      seed: 1,
      opacityMin: 0.4,
      opacityMax: 1.0,
    })
  )
  const [triangle, setTriangle] = useState<TriangleState>(INITIAL_TRIANGLE)
  const [sectors, setSectors] = useState(INITIAL_SECTORS)
  const [flip, setFlip] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [interval, setInterval_] = useState(100)

  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const triangleRef = useRef(triangle)
  const sectorsRef = useRef(sectors)
  const flipRef = useRef(flip)
  const intervalRef = useRef(interval)

  useEffect(() => { triangleRef.current = triangle }, [triangle])
  useEffect(() => { sectorsRef.current = sectors }, [sectors])
  useEffect(() => { flipRef.current = flip }, [flip])
  useEffect(() => { intervalRef.current = interval }, [interval])

  const background = getLightestColor(palette.colors)

  // Rasterize SVG and store in offscreenRef
  const rasterize = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current
    const svg = svgRef.current
    if (!canvas || !svg) return null
    const dpr = (window.devicePixelRatio || 1) * 2
    const cssSize = Math.min(canvas.clientWidth, canvas.clientHeight) || SVG_SIZE
    const px = Math.round(cssSize * dpr)
    canvas.width = px
    canvas.height = px
    const svgString = new XMLSerializer().serializeToString(svg)
    return rasterizeSVG(svgString, px, px)
  }, [])

  // Render kaleidoscope synchronously from current state
  const renderNow = useCallback((t = triangleRef.current, s = sectorsRef.current, f = flipRef.current) => {
    const canvas = canvasRef.current
    const offscreen = offscreenRef.current
    if (!canvas || !offscreen) return
    renderKaleidoscope({ canvas, offscreenCanvas: offscreen, triangle: t, sectors: s, flip: f })
  }, [])

  // Re-rasterize whenever the base image changes, then re-render
  useEffect(() => {
    const id = setTimeout(async () => {
      const offscreen = await rasterize()
      if (offscreen) {
        offscreenRef.current = offscreen
        renderNow()
      }
    }, 50)
    return () => clearTimeout(id)
  }, [descriptors, background, rasterize, renderNow])

  // Live preview — re-render on triangle/sectors/flip change
  useEffect(() => {
    if (offscreenRef.current) renderNow(triangle, sectors, flip)
  }, [triangle, sectors, flip, renderNow])

  // Re-generate with same seed when palette changes — preserves layout, updates colors
  useEffect(() => {
    setDescriptors(generateImage({ enabledTypes, palette, count, complexity, seed, opacityMin, opacityMax }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette])

  const handleGenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 0xffffffff)
    setSeed(newSeed)
    const p = palette.id === 'full-random' ? generateFullRandomPalette(count) : palette
    if (p !== palette) setPalette(p)
    setDescriptors(generateImage({ enabledTypes, palette: p, count, complexity, seed: newSeed, opacityMin, opacityMax }))
  }, [enabledTypes, palette, count, complexity, opacityMin, opacityMax])

  const handleSectorsChange = useCallback((s: number) => {
    setSectors(s)
    setTriangle(t => {
      const height = t.size * Math.cos(Math.PI / sectorsRef.current)
      return { ...t, size: height / Math.cos(Math.PI / s) }
    })
  }, [])

  const handlePlay = useCallback(async () => {
    if (isPlaying) { setIsPlaying(false); return }
    // Ensure offscreen canvas is ready
    if (!offscreenRef.current) {
      const offscreen = await rasterize()
      if (!offscreen) return
      offscreenRef.current = offscreen
    }
    setIsPlaying(true)
  }, [isPlaying, rasterize])

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return
    const id = window.setInterval(() => {
      const next: TriangleState = { ...triangleRef.current, angle: triangleRef.current.angle + ROTATE_STEP }
      triangleRef.current = next
      setTriangle(next)
      const canvas = canvasRef.current
      const offscreen = offscreenRef.current
      if (canvas && offscreen) {
        renderKaleidoscope({ canvas, offscreenCanvas: offscreen, triangle: next, sectors: sectorsRef.current, flip: flipRef.current })
      }
    }, intervalRef.current)
    return () => window.clearInterval(id)
  }, [isPlaying, interval])

  const fps = Math.round(1000 / interval)

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="flex items-center px-6 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--text)', textTransform: 'uppercase' }}>
          Kaleidoscope
        </h1>
      </header>

      {/* Three-column layout */}
      <div className="flex-1 grid grid-cols-[220px_1fr_1fr] overflow-hidden">

        {/* Left panel — controls */}
        <aside className="flex flex-col overflow-y-auto" style={{ background: 'var(--panel)', borderRight: '1px solid var(--border)' }}>
          <CollapsibleSection title="Composition" hint={`${enabledTypes.length} of ${ALL_TYPES.length}`}>
            <PrimitiveSelector selected={enabledTypes} onChange={setEnabledTypes} />
          </CollapsibleSection>
          <CollapsibleSection title="Palette">
            <PaletteSelector selected={palette} count={count} onChange={setPalette} />
          </CollapsibleSection>
          <CollapsibleSection title="Density">
            <DensityControls count={count} complexity={complexity} onCountChange={setCount} onComplexityChange={setComplexity} />
          </CollapsibleSection>
          <CollapsibleSection title="Color">
            <PaletteControls
              opacityMin={opacityMin} opacityMax={opacityMax}
              onOpacityMinChange={setOpacityMin} onOpacityMaxChange={setOpacityMax}
            />
          </CollapsibleSection>
          <div className="mt-auto p-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleGenerate}
              className="w-full py-2 rounded text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--accent)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Generate
            </button>
          </div>
        </aside>

        {/* Center panel — base image + triangle selector */}
        <section className="flex flex-col gap-3 overflow-hidden" style={{ borderRight: '1px solid var(--border)' }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="label">Base Image</span>
              <span className="flex items-center gap-1" style={{ fontSize: 10, color: '#4ade80', fontFamily: 'monospace' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                LIVE
              </span>
            </div>
          </div>
          <div className="relative flex-1 mx-3 mb-3 rounded overflow-hidden" style={{ background: 'var(--canvas-letterbox)' }}>
            <BaseImageSVG descriptors={descriptors} background={background} svgRef={svgRef} />
            <div className="absolute inset-0">
              <TriangleSelector state={triangle} onChange={setTriangle} svgSize={SVG_SIZE} sectors={sectors} />
            </div>
          </div>
        </section>

        {/* Right panel — kaleidoscope */}
        <section className="flex flex-col gap-3 overflow-hidden" style={{ background: 'var(--panel)' }}>
          {/* Toolbar */}
          <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="label">Kaleidoscope</span>
          </div>
          <div className="flex-1 mx-3 rounded overflow-hidden flex items-center justify-center" style={{ background: 'var(--kaleido-bg)', boxShadow: 'var(--kaleido-glow)' }}>
            <KaleidoscopeCanvas ref={canvasRef} />
          </div>
          <div className="px-3 pb-3 flex flex-col gap-3">
            <SectorControls sectors={sectors} flip={flip} onSectorsChange={handleSectorsChange} onFlipChange={setFlip} />
            <div className="flex flex-col gap-1">
              <label className="label flex justify-between">
                <span>Interval</span>
                <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 10 }}>
                  {interval}ms <span style={{ color: 'var(--text-faint)' }}>· {fps}fps</span>
                </span>
              </label>
              <input type="range" min={50} max={1000} step={50} value={interval}
                onChange={e => setInterval_(Number(e.target.value))}
                className="w-full accent-violet-500" />
            </div>
            <button
              onClick={handlePlay}
              className="w-full py-2 rounded text-sm font-medium text-white transition-colors"
              style={{ background: isPlaying ? 'var(--accent-dim)' : 'var(--accent)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
              onMouseOut={e => (e.currentTarget.style.background = isPlaying ? 'var(--accent-dim)' : 'var(--accent)')}
            >
              {isPlaying ? 'Stop' : '▶ Play'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
