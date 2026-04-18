'use client'
import React from 'react'
import type { ColorStrategy } from '@/lib/generateImage'

interface Props {
  opacityMin: number
  opacityMax: number
  colorStrategy: ColorStrategy
  onOpacityMinChange: (v: number) => void
  onOpacityMaxChange: (v: number) => void
  onColorStrategyChange: (v: ColorStrategy) => void
}

const STRATEGIES: { value: ColorStrategy; label: string }[] = [
  { value: 'random',     label: 'Random' },
  { value: 'sequential', label: 'Sequential' },
  { value: 'by-type',    label: 'By type' },
]

export function PaletteControls({
  opacityMin, opacityMax, colorStrategy,
  onOpacityMinChange, onOpacityMaxChange, onColorStrategyChange,
}: Props) {
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
            onOpacityMinChange(v)
            if (v > opacityMax) onOpacityMaxChange(v)
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
            onOpacityMaxChange(v)
            if (v < opacityMin) onOpacityMinChange(v)
          }}
          className="w-full accent-violet-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="label">Color strategy</span>
        <div className="flex gap-1">
          {STRATEGIES.map(s => (
            <button
              key={s.value}
              onClick={() => onColorStrategyChange(s.value)}
              className="flex-1 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: colorStrategy === s.value ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                color: colorStrategy === s.value ? '#fff' : 'var(--text-dim)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
