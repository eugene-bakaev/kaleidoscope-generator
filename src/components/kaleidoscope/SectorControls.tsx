'use client'
import React from 'react'

interface Props {
  sectors: number
  flip: boolean
  onSectorsChange: (v: number) => void
  onFlipChange: (v: boolean) => void
}

export function SectorControls({ sectors, flip, onSectorsChange, onFlipChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="label flex justify-between">
          <span>Sectors</span>
          <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 10 }}>{sectors}</span>
        </label>
        <input
          type="range"
          min={4}
          max={24}
          step={2}
          value={sectors}
          onChange={e => onSectorsChange(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
        <input
          type="checkbox"
          aria-label="Flip alternate sectors"
          checked={flip}
          onChange={e => onFlipChange(e.target.checked)}
          className="accent-violet-500"
        />
        Flip alternate sectors
      </label>
    </div>
  )
}
