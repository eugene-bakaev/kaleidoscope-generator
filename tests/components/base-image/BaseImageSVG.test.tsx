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
