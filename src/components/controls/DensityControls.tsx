'use client'
import React from 'react'

interface Props {
  count: number
  complexity: number
  onCountChange: (v: number) => void
  onComplexityChange: (v: number) => void
}

export function DensityControls({ count, complexity, onCountChange, onComplexityChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="label flex justify-between">
          <span>Density</span>
          <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 10 }}>{count}</span>
        </label>
        <input
          type="range"
          role="slider"
          min={3}
          max={30}
          value={count}
          onChange={e => onCountChange(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="label flex justify-between">
          <span>Complexity</span>
          <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 10 }}>{Math.round(complexity * 100)}%</span>
        </label>
        <input
          type="range"
          role="slider"
          min={0}
          max={100}
          value={Math.round(complexity * 100)}
          onChange={e => onComplexityChange(Number(e.target.value) / 100)}
          className="w-full accent-violet-500"
        />
      </div>
    </div>
  )
}
