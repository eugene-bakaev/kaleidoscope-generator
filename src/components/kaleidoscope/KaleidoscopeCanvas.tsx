'use client'
import React, { forwardRef } from 'react'

export const KaleidoscopeCanvas = forwardRef<HTMLCanvasElement>(
  function KaleidoscopeCanvas(_, ref) {
    return (
      <canvas
        ref={ref}
        width={500}
        height={500}
        className="w-full h-full object-contain rounded"
      />
    )
  }
)
