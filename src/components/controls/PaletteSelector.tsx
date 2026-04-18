'use client'
import React, { useState } from 'react'
import { PALETTES, generateRandomPalette, generateFullRandomPalette, type Palette } from '@/lib/palette'

interface Props {
  selected: Palette
  count: number
  onChange: (palette: Palette) => void
}

export function PaletteSelector({ selected, count, onChange }: Props) {
  const [randomPalette, setRandomPalette] = useState<Palette>(() => generateRandomPalette())

  const handleRegenRandom = () => {
    const next = generateRandomPalette()
    setRandomPalette(next)
    if (selected.id === 'random') onChange(next)
  }

  const handleFullRandom = () => {
    onChange(generateFullRandomPalette(count))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        {PALETTES.map(palette => (
          <button
            key={palette.id}
            onClick={() => onChange(palette)}
            title={palette.name}
            className={`h-6 rounded flex overflow-hidden border-2 transition-colors ${
              selected.id === palette.id ? 'border-violet-400' : 'border-transparent'
            }`}
          >
            {palette.colors.map(color => (
              <div key={color} className="flex-1 h-full" style={{ background: color }} />
            ))}
          </button>
        ))}

        {/* Random palette */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => onChange(randomPalette)}
            title="Random"
            className={`flex-1 h-6 rounded flex overflow-hidden border-2 transition-colors ${
              selected.id === 'random' ? 'border-violet-400' : 'border-transparent'
            }`}
          >
            {randomPalette.colors.map(color => (
              <div key={color} className="flex-1 h-full" style={{ background: color }} />
            ))}
          </button>
          <button
            onClick={handleRegenRandom}
            title="New random palette"
            className="control-btn px-1.5"
          >
            ↺
          </button>
        </div>

        {/* Full random — unique color per shape */}
        <div className="flex gap-1 items-center">
          <button
            onClick={handleFullRandom}
            title="Full Random — unique color per shape"
            className={`flex-1 h-6 rounded flex items-center justify-center border-2 transition-colors text-xs ${
              selected.id === 'full-random' ? 'border-violet-400' : 'border-transparent'
            }`}
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}
          >
            🎲 Full Random
          </button>
          <button
            onClick={handleFullRandom}
            title="Regenerate full random"
            className="control-btn px-1.5"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  )
}
