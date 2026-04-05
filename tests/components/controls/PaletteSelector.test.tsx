import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PaletteSelector } from '@/components/controls/PaletteSelector'
import { PALETTES } from '@/lib/palette'

describe('PaletteSelector', () => {
  it('renders a swatch for each palette', () => {
    const { getAllByRole } = render(
      <PaletteSelector selected={PALETTES[0]} onChange={vi.fn()} />
    )
    expect(getAllByRole('button').length).toBe(PALETTES.length)
  })

  it('calls onChange with the clicked palette', () => {
    const onChange = vi.fn()
    const { getAllByRole } = render(
      <PaletteSelector selected={PALETTES[0]} onChange={onChange} />
    )
    fireEvent.click(getAllByRole('button')[2])
    expect(onChange).toHaveBeenCalledWith(PALETTES[2])
  })
})
