'use client'
import React from 'react'

interface Props {
  opacityMin: number
  opacityMax: number
  onOpacityChange: (min: number, max: number) => void
}

export function PaletteControls({ opacityMin, opacityMax, onOpacityChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="label flex justify-between">
          <span>Opacity min</span>
          <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 10 }}>{Math.round(opacityMin * 100)}%</span>
        </label>
        <input
          type="range" min={0} max={100} step={5}
          value={Math.round(opacityMin * 100)}
          onChange={e => {
            const v = Number(e.target.value) / 100
            onOpacityChange(v, Math.max(v, opacityMax))
          }}
          className="w-full accent-violet-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="label flex justify-between">
          <span>Opacity max</span>
          <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 10 }}>{Math.round(opacityMax * 100)}%</span>
        </label>
        <input
          type="range" min={0} max={100} step={5}
          value={Math.round(opacityMax * 100)}
          onChange={e => {
            const v = Number(e.target.value) / 100
            onOpacityChange(Math.min(v, opacityMin), v)
          }}
          className="w-full accent-violet-500"
        />
      </div>
    </div>
  )
}
