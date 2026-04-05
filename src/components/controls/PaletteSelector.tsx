'use client'
import React from 'react'
import { PALETTES, type Palette } from '@/lib/palette'

interface Props {
  selected: Palette
  onChange: (palette: Palette) => void
}

export function PaletteSelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label">Palette</span>
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
      </div>
    </div>
  )
}
