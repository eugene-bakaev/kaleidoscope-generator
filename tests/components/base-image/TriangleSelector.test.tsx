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
