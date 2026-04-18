'use client'
import React, { useState } from 'react'

interface Props {
  title: string
  hint?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({ title, hint, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
          {title}
        </span>
        <span className="flex items-center gap-2">
          {hint && (
            <span style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: 0, textTransform: 'none' }}>
              {hint}
            </span>
          )}
          <span style={{ fontSize: 10, color: 'var(--text-faint)', lineHeight: 1 }}>
            {open ? '−' : '+'}
          </span>
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}
