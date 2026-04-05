import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { DensityControls } from '@/components/controls/DensityControls'

describe('DensityControls', () => {
  it('renders count and complexity sliders', () => {
    const { getAllByRole } = render(
      <DensityControls count={10} complexity={0.5} onCountChange={vi.fn()} onComplexityChange={vi.fn()} />
    )
    expect(getAllByRole('slider').length).toBe(2)
  })

  it('calls onCountChange when count slider changes', () => {
    const onCountChange = vi.fn()
    const { getAllByRole } = render(
      <DensityControls count={10} complexity={0.5} onCountChange={onCountChange} onComplexityChange={vi.fn()} />
    )
    fireEvent.change(getAllByRole('slider')[0], { target: { value: '20' } })
    expect(onCountChange).toHaveBeenCalledWith(20)
  })
})
