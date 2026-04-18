'use client'
import React, { useState } from 'react'
import { PALETTES, generateRandomPalette, type Palette } from '@/lib/palette'

interface Props {
  selected: Palette
  onChange: (palette: Palette) => void
}

export function PaletteSelector({ selected, onChange }: Props) {
  const [randomPalette, setRandomPalette] = useState<Palette>(() => generateRandomPalette())

  const handleRegenRandom = () => {
    const next = generateRandomPalette()
    setRandomPalette(next)
    if (selected.id === 'random') onChange(next)
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
      </div>
    </div>
  )
}
