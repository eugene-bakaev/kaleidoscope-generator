// tests/lib/kaleidoscope.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderKaleidoscope } from '@/lib/kaleidoscope'

// Mock canvas and context
const mockCtx = {
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  drawImage: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  clip: vi.fn(),
}

const mockCanvas = {
  width: 500,
  height: 500,
  getContext: vi.fn().mockReturnValue(mockCtx),
} as unknown as HTMLCanvasElement

const mockOffscreen = {
  width: 500,
  height: 500,
} as HTMLCanvasElement

describe('renderKaleidoscope', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls clearRect once', () => {
    renderKaleidoscope({
      canvas: mockCanvas,
      offscreenCanvas: mockOffscreen,
      triangle: { cx: 250, cy: 250, angle: 0, size: 100 },
      sectors: 6,
      flip: false,
    })
    expect(mockCtx.clearRect).toHaveBeenCalledTimes(1)
  })

  it('calls save/restore N times for N sectors', () => {
    renderKaleidoscope({
      canvas: mockCanvas,
      offscreenCanvas: mockOffscreen,
      triangle: { cx: 250, cy: 250, angle: 0, size: 100 },
      sectors: 8,
      flip: false,
    })
    expect(mockCtx.save).toHaveBeenCalledTimes(8)
    expect(mockCtx.restore).toHaveBeenCalledTimes(8)
  })
})
