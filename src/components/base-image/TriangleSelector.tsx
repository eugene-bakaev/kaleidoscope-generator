'use client'
import React, { useRef, useCallback, useState } from 'react'
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
  const [hovered, setHovered] = useState(false)

  const vertices = triangleVertices(cx, cy, angle, size, sectors)
  const points = vertices.map(v => `${v.x},${v.y}`).join(' ')
  const apex = vertices[0]
  const h1 = vertices[1]
  const h2 = vertices[2]

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
        {/* Hover rotation ring */}
        {hovered && (
          <circle
            cx={apex.x} cy={apex.y} r={28}
            fill="none" stroke="#ffd700" strokeWidth={1}
            strokeDasharray="4 3" opacity={0.55}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Triangle */}
        <polygon
          points={points}
          fill="rgba(255,215,0,0.06)"
          stroke="#ffd700"
          strokeWidth="2"
          strokeDasharray="6 3"
          style={{ pointerEvents: 'all', cursor: 'move' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        />

        {/* Base corner handles */}
        <rect x={h1.x - 4} y={h1.y - 4} width={8} height={8} fill="#ffd700" style={{ pointerEvents: 'none' }} />
        <rect x={h2.x - 4} y={h2.y - 4} width={8} height={8} fill="#ffd700" style={{ pointerEvents: 'none' }} />

        {/* Apex dot */}
        <circle cx={apex.x} cy={apex.y} r={5} fill="#ffd700" style={{ pointerEvents: 'none' }} />
        <circle cx={apex.x} cy={apex.y} r={2} fill="#000" style={{ pointerEvents: 'none' }} />
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
