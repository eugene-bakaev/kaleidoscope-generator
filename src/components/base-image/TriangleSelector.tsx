'use client'
import React, { useRef, useCallback } from 'react'
import type { TriangleState } from '@/lib/kaleidoscope'

interface Props {
  state: TriangleState
  onChange: (next: TriangleState) => void
  svgSize: number   // side length of the SVG viewBox (500)
  sectors: number
}

const MOVE_STEP = 5
const ROTATE_STEP = (5 * Math.PI) / 180
const SCALE_FACTOR = 0.1

export function TriangleSelector({ state, onChange, svgSize, sectors }: Props) {
  const { cx, cy, angle, size } = state
  const isDragging = useRef(false)
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)

  const vertices = triangleVertices(cx, cy, angle, size, sectors)
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

  return (
    <div className="flex flex-col gap-2">
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

function triangleVertices(cx: number, cy: number, angle: number, size: number, sectors: number) {
  const half = Math.PI / sectors
  return [
    { x: cx, y: cy },
    { x: cx + Math.cos(angle - half) * size, y: cy + Math.sin(angle - half) * size },
    { x: cx + Math.cos(angle + half) * size, y: cy + Math.sin(angle + half) * size },
  ]
}
