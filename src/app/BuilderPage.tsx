'use client'
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { PrimitiveSelector } from '@/components/controls/PrimitiveSelector'
import { PaletteSelector } from '@/components/controls/PaletteSelector'
import { DensityControls } from '@/components/controls/DensityControls'
import { PaletteControls } from '@/components/controls/PaletteControls'
import { CollapsibleSection } from '@/components/controls/CollapsibleSection'
import { BaseImageSVG } from '@/components/base-image/BaseImageSVG'
import { TriangleSelector, type PivotMode } from '@/components/base-image/TriangleSelector'
import { KaleidoscopeCanvas } from '@/components/kaleidoscope/KaleidoscopeCanvas'
import { SectorControls } from '@/components/kaleidoscope/SectorControls'
import { generateImage, effectivePrimitiveCount } from '@/lib/generateImage'
import { renderKaleidoscope, rasterizeSVG, rotateAroundPivot, triangleVertices, type TriangleState } from '@/lib/kaleidoscope'
import { PALETTES, getLightestColor, generateFullRandomPalette, type Palette } from '@/lib/palette'
import type { PrimitiveType, PrimitiveDescriptor } from '@/lib/primitives/types'

const INITIAL_SVG_SIZE = 500
const INITIAL_SECTORS = 8
const ROTATE_STEP = (5 * Math.PI) / 180

const triangleSizeForSectors = (n: number, svgSize: number) => (svgSize / 2) * Math.tan(Math.PI / n)

const ALL_TYPES: PrimitiveType[] = ['circles', 'concentricCircles', 'spirals', 'zigzags', 'lines', 'dots', 'polygons', 'sines']

export default function BuilderPage() {
  const [enabledTypes, setEnabledTypes] = useState<PrimitiveType[]>(['circles', 'dots', 'lines', 'polygons'])
  const [palette, setPalette] = useState<Palette>(PALETTES[0])
  const [count, setCount] = useState(10)
  const [complexity, setComplexity] = useState(0.5)
  const [opacityMin, setOpacityMin] = useState(0.4)
  const [opacityMax, setOpacityMax] = useState(1.0)
  const [seed, setSeed] = useState(1)
  const [svgSize, setSvgSize] = useState(INITIAL_SVG_SIZE)
  const [descriptors, setDescriptors] = useState<PrimitiveDescriptor[]>(() =>
    generateImage({
      enabledTypes: ['circles', 'dots', 'lines', 'polygons'],
      palette: PALETTES[0],
      count: 10,
      complexity: 0.5,
      seed: 1,
      opacityMin: 0.4,
      opacityMax: 1.0,
      svgSize: INITIAL_SVG_SIZE,
    })
  )
  const [triangle, setTriangle] = useState<TriangleState>({
    cx: INITIAL_SVG_SIZE / 2,
    cy: INITIAL_SVG_SIZE / 2,
    angle: 0,
    size: triangleSizeForSectors(INITIAL_SECTORS, INITIAL_SVG_SIZE),
  })
  const [sectors, setSectors] = useState(INITIAL_SECTORS)
  const [flip, setFlip] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [interval, setInterval_] = useState(100)
  const [pivotMode, setPivotMode] = useState<PivotMode>('apex')
  const [pivot, setPivot] = useState({ x: INITIAL_SVG_SIZE / 2, y: INITIAL_SVG_SIZE / 2 })

  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const triangleRef = useRef(triangle)
  const sectorsRef = useRef(sectors)
  const flipRef = useRef(flip)
  const intervalRef = useRef(interval)
  const svgSizeRef = useRef(svgSize)
  const pivotRef = useRef(pivot)

  // Keep latest-value refs in sync during render — always current before any handler fires
  triangleRef.current = triangle
  sectorsRef.current = sectors
  flipRef.current = flip
  intervalRef.current = interval
  svgSizeRef.current = svgSize
  pivotRef.current = pivot

  const background = useMemo(() => getLightestColor(palette.colors), [palette])

  // Rasterize SVG and store in offscreenRef
  const rasterize = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current
    const svg = svgRef.current
    if (!canvas || !svg) return null
    const dpr = (window.devicePixelRatio || 1) * 2
    const cssSize = Math.min(canvas.clientWidth, canvas.clientHeight) || INITIAL_SVG_SIZE
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
    renderKaleidoscope({ canvas, offscreenCanvas: offscreen, triangle: t, sectors: s, flip: f, svgSize: svgSizeRef.current })
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
    setDescriptors(generateImage({ enabledTypes, palette, count, complexity, seed, opacityMin, opacityMax, svgSize }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette])

  // Re-generate with new bounds when canvas size changes — primitives spread over new area
  useEffect(() => {
    setDescriptors(generateImage({ enabledTypes, palette, count, complexity, seed, opacityMin, opacityMax, svgSize }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgSize])

  const handleGenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 0xffffffff)
    setSeed(newSeed)
    const p = palette.id === 'full-random' ? generateFullRandomPalette(effectivePrimitiveCount(count, svgSize)) : palette
    if (p !== palette) setPalette(p)
    setDescriptors(generateImage({ enabledTypes, palette: p, count, complexity, seed: newSeed, opacityMin, opacityMax, svgSize }))
  }, [enabledTypes, palette, count, complexity, opacityMin, opacityMax, svgSize])

  // Compute the snapped pivot position for non-custom modes
  const computeSnappedPivot = useCallback((t: TriangleState, mode: PivotMode, s: number) => {
    if (mode === 'custom') return null
    const verts = triangleVertices(t, s)
    if (mode === 'apex')  return verts[0]
    if (mode === 'left')  return verts[1]
    if (mode === 'right') return verts[2]
    return verts[0]
  }, [])

  // Keep pivot snapped when triangle moves (for non-custom modes)
  const handleTriangleChange = useCallback((next: TriangleState) => {
    setTriangle(next)
    const snapped = computeSnappedPivot(next, pivotMode, sectorsRef.current)
    if (snapped) setPivot(snapped)
  }, [pivotMode, computeSnappedPivot])

  // Snap pivot to new corner when mode changes
  const handlePivotModeChange = useCallback((mode: PivotMode) => {
    setPivotMode(mode)
    if (mode !== 'custom') {
      const snapped = computeSnappedPivot(triangleRef.current, mode, sectorsRef.current)
      if (snapped) setPivot(snapped)
    }
  }, [computeSnappedPivot])

  const handleSvgSizeChange = useCallback((newSize: number) => {
    const scale = newSize / svgSizeRef.current
    setTriangle(t => ({ ...t, cx: t.cx * scale, cy: t.cy * scale, size: t.size * scale }))
    setPivot(p => ({ x: p.x * scale, y: p.y * scale }))
    setSvgSize(newSize)
  }, [])

  const handleSectorsChange = useCallback((s: number) => {
    setSectors(s)
    setTriangle(t => {
      const height = t.size * Math.cos(Math.PI / sectorsRef.current)
      const next = { ...t, size: height / Math.cos(Math.PI / s) }
      const snapped = computeSnappedPivot(next, pivotMode, s)
      if (snapped) setPivot(snapped)
      return next
    })
  }, [pivotMode, computeSnappedPivot])

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
      const next = rotateAroundPivot(triangleRef.current, pivotRef.current, ROTATE_STEP)
      triangleRef.current = next
      setTriangle(next)
      // For non-custom pivot modes, the pivot itself follows the triangle vertex
      // (apex mode: pivot stays fixed since apex IS the pivot; corner modes: pivot orbits with the corner)
      // We don't update pivotRef here — it stays fixed as the orbit center
      const canvas = canvasRef.current
      const offscreen = offscreenRef.current
      if (canvas && offscreen) {
        renderKaleidoscope({ canvas, offscreenCanvas: offscreen, triangle: next, sectors: sectorsRef.current, flip: flipRef.current, svgSize: svgSizeRef.current })
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
            <PaletteSelector selected={palette} count={effectivePrimitiveCount(count, svgSize)} onChange={setPalette} />
          </CollapsibleSection>
          <CollapsibleSection title="Density">
            <DensityControls count={count} complexity={complexity} onCountChange={setCount} onComplexityChange={setComplexity} />
          </CollapsibleSection>
          <CollapsibleSection title="Color">
            <PaletteControls
              opacityMin={opacityMin} opacityMax={opacityMax}
              onOpacityChange={(min, max) => { setOpacityMin(min); setOpacityMax(max) }}
            />
          </CollapsibleSection>
          <div className="mt-auto p-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleGenerate}
              className="w-full py-2 rounded text-sm font-medium text-white"
              style={{ background: 'var(--accent)' }}
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
            <div className="flex items-center gap-2">
              <span className="label" style={{ color: 'var(--text-dim)' }}>Canvas</span>
              <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 10, width: 36, textAlign: 'right' }}>{svgSize}</span>
              <input
                type="range" min={500} max={2000} step={100}
                value={svgSize}
                onChange={e => handleSvgSizeChange(Number(e.target.value))}
                className="accent-violet-500"
                style={{ width: 80 }}
              />
            </div>
          </div>
          <div className="relative flex-1 mx-3 mb-3 rounded overflow-hidden" style={{ background: 'var(--canvas-letterbox)' }}>
            <BaseImageSVG descriptors={descriptors} background={background} svgRef={svgRef} svgSize={svgSize} />
            <div className="absolute inset-0">
              <TriangleSelector
                state={triangle} onChange={handleTriangleChange} svgSize={svgSize} sectors={sectors}
                pivot={pivot} pivotMode={pivotMode}
                onPivotChange={setPivot} onPivotModeChange={handlePivotModeChange}
              />
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
              className="w-full py-2 rounded text-sm font-medium text-white"
              style={{ background: isPlaying ? 'var(--accent-dim)' : 'var(--accent)' }}
            >
              {isPlaying ? 'Stop' : '▶ Play'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
