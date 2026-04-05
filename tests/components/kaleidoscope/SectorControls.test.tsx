import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SectorControls } from '@/components/kaleidoscope/SectorControls'

describe('SectorControls', () => {
  it('renders sector slider and flip toggle', () => {
    const { getByRole, getByLabelText } = render(
      <SectorControls sectors={6} flip={false} onSectorsChange={vi.fn()} onFlipChange={vi.fn()} />
    )
    expect(getByRole('slider')).not.toBeNull()
    expect(getByLabelText('Flip alternate sectors')).not.toBeNull()
  })

  it('calls onSectorsChange when slider changes', () => {
    const onSectorsChange = vi.fn()
    const { getByRole } = render(
      <SectorControls sectors={6} flip={false} onSectorsChange={onSectorsChange} onFlipChange={vi.fn()} />
    )
    fireEvent.change(getByRole('slider'), { target: { value: '12' } })
    expect(onSectorsChange).toHaveBeenCalledWith(12)
  })
})
