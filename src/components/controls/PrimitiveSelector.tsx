'use client'
import React from 'react'
import type { PrimitiveType } from '@/lib/primitives/types'

const ALL_TYPES: { type: PrimitiveType; label: string }[] = [
  { type: 'circles',           label: 'Circles' },
  { type: 'concentricCircles', label: 'Concentric' },
  { type: 'spirals',           label: 'Spirals' },
  { type: 'zigzags',           label: 'Zigzags' },
  { type: 'lines',             label: 'Lines' },
  { type: 'dots',              label: 'Dots' },
  { type: 'polygons',          label: 'Polygons' },
  { type: 'sines',             label: 'Sines' },
]

interface Props {
  selected: PrimitiveType[]
  onChange: (next: PrimitiveType[]) => void
}

export function PrimitiveSelector({ selected, onChange }: Props) {
  const toggle = (type: PrimitiveType) => {
    if (selected.includes(type)) {
      if (selected.length === 1) return  // keep at least one
      onChange(selected.filter(t => t !== type))
    } else {
      onChange([...selected, type])
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="label">Primitives</span>
      {ALL_TYPES.map(({ type, label }) => (
        <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-neutral-300 hover:text-white">
          <input
            type="checkbox"
            role="checkbox"
            checked={selected.includes(type)}
            onChange={() => toggle(type)}
            className="accent-violet-500"
          />
          {label}
        </label>
      ))}
    </div>
  )
}
