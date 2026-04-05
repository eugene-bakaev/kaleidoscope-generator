import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PrimitiveSelector } from '@/components/controls/PrimitiveSelector'
import type { PrimitiveType } from '@/lib/primitives/types'

describe('PrimitiveSelector', () => {
  it('renders all 8 primitive types', () => {
    const { getAllByRole } = render(
      <PrimitiveSelector selected={['circles']} onChange={vi.fn()} />
    )
    expect(getAllByRole('checkbox').length).toBe(8)
  })

  it('calls onChange when a toggle is clicked', () => {
    const onChange = vi.fn()
    const { getAllByRole } = render(
      <PrimitiveSelector selected={['circles']} onChange={onChange} />
    )
    fireEvent.click(getAllByRole('checkbox')[1])
    expect(onChange).toHaveBeenCalled()
  })

  it('does not allow deselecting the last item', () => {
    const onChange = vi.fn()
    const { getAllByRole } = render(
      <PrimitiveSelector selected={['circles']} onChange={onChange} />
    )
    // Click the only selected checkbox (index 0 = circles)
    fireEvent.click(getAllByRole('checkbox')[0])
    expect(onChange).not.toHaveBeenCalled()
  })
})
