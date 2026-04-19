'use client'
import React, { useRef, useCallback, useMemo } from 'react'
import type { TriangleState } from '@/lib/kaleidoscope'
import { triangleVertices } from '@/lib/kaleidoscope'

export type PivotMode = 'apex' | 'left' | 'right' | 'custom'

interface Props {
  state: TriangleState
  onChange: (next: TriangleState) => void
  svgSize: number
  sectors: number
  pivot: { x: number; y: number }
  pivotMode: PivotMode
  onPivotChange: (p: { x: number; y: number }) => void
  onPivotModeChange: (mode: PivotMode) => void
}

const MOVE_STEP = 5
const ROTATE_STEP = (5 * Math.PI) / 180
const SCALE_FACTOR = 0.1

const PIVOT_MODES: { mode: PivotMode; label: string; title: string }[] = [
  { mode: 'apex',   label: 'A', title: 'Pivot: apex' },
  { mode: 'left',   label: 'L', title: 'Pivot: left corner' },
  { mode: 'right',  label: 'R', title: 'Pivot: right corner' },
  { mode: 'custom', label: '⊕', title: 'Pivot: custom (drag the marker)' },
]

export function TriangleSelector({ state, onChange, svgSize, sectors, pivot, pivotMode, onPivotChange, onPivotModeChange }: Props) {
  const { cx, cy, angle, size } = state
  const isDragging = useRef(false)
  const isDraggingPivot = useRef(false)
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [vertices, points] = useMemo(() => {
    const v = triangleVertices(state, sectors)
    return [v, v.map(p => `${p.x},${p.y}`).join(' ')] as const
  }, [state, sectors])
  const [apex, h1, h2] = vertices

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

  // Triangle drag
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt = svgPoint(e)
    if (pt) dragOffset.current = { dx: cx - pt.x, dy: cy - pt.y }
    isDragging.current = true
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const pt = svgPoint(e)
    if (!pt) return
    onChange({ ...state, cx: pt.x + dragOffset.current.dx, cy: pt.y + dragOffset.current.dy })
  }

  const onPointerUp = () => { isDragging.current = false }

  // Pivot drag (custom mode only)
  const onPivotPointerDown = (e: React.PointerEvent) => {
    if (pivotMode !== 'custom') return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    isDraggingPivot.current = true
  }

  const onPivotPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingPivot.current) return
    const pt = svgPoint(e)
    if (!pt) return
    onPivotChange(pt)
  }

  const onPivotPointerUp = () => { isDraggingPivot.current = false }

  return (
    <div className="flex flex-col gap-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
        onPointerMove={onPivotPointerMove}
        onPointerUp={onPivotPointerUp}
      >
        {/* Triangle — white halo + dark dashed line for contrast on any background */}
        <polygon
          points={points}
          fill="none"
          stroke="#fff"
          strokeWidth={4}
          style={{ pointerEvents: 'all', cursor: 'move' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
        <polygon
          points={points}
          fill="none"
          stroke="#0b0b0f"
          strokeWidth={2}
          strokeDasharray="6 4"
          style={{ pointerEvents: 'none' }}
        />

        {/* All three vertex handles — same style */}
        <circle cx={apex.x} cy={apex.y} r={5} fill="#fff" stroke="#0b0b0f" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
        <circle cx={h1.x} cy={h1.y} r={5} fill="#fff" stroke="#0b0b0f" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
        <circle cx={h2.x} cy={h2.y} r={5} fill="#fff" stroke="#0b0b0f" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />

        {/* Pivot marker — always visible, draggable in custom mode */}
        <circle
          cx={pivot.x} cy={pivot.y}
          r={9}
          fill="#ffffff"
          stroke="#0b0b0f" strokeWidth={2}
          style={{ pointerEvents: pivotMode === 'custom' ? 'all' : 'none', cursor: pivotMode === 'custom' ? 'grab' : 'default' }}
          onPointerDown={onPivotPointerDown}
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

      {/* Pivot mode selector */}
      <div className="flex gap-1 justify-center items-center">
        <span className="label" style={{ color: 'var(--text-faint)', fontSize: 9 }}>PIVOT</span>
        {PIVOT_MODES.map(({ mode, label, title }) => (
          <button
            key={mode}
            title={title}
            onClick={() => onPivotModeChange(mode)}
            className="control-btn"
            style={{
              background: pivotMode === mode ? 'rgba(96,165,250,0.25)' : undefined,
              borderColor: pivotMode === mode ? '#60a5fa' : undefined,
              color: pivotMode === mode ? '#60a5fa' : undefined,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
