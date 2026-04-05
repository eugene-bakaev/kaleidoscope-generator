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
