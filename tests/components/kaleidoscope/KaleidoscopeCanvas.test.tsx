import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { KaleidoscopeCanvas } from '@/components/kaleidoscope/KaleidoscopeCanvas'

describe('KaleidoscopeCanvas', () => {
  it('renders a canvas element', () => {
    const { container } = render(<KaleidoscopeCanvas ref={null} />)
    expect(container.querySelector('canvas')).not.toBeNull()
  })
})
