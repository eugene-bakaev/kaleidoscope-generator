// src/lib/palette.ts

export interface Palette {
  id: string
  name: string
  colors: string[]  // 5–6 hex strings, from light to dark
}

export const PALETTES: Palette[] = [
  {
    id: 'cosmic',
    name: 'Cosmic',
    colors: ['#e0aaff', '#c77dff', '#9d4edd', '#7b2d8b', '#560bad', '#3a0ca3'],
  },
  {
    id: 'ember',
    name: 'Ember',
    colors: ['#ffdd99', '#ffb347', '#ff6b35', '#e63946', '#9d0208', '#6a040f'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: ['#caf0f8', '#90e0ef', '#00b4d8', '#0077b6', '#03045e', '#023e8a'],
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: ['#d8f3dc', '#95d5b2', '#52b788', '#2d6a4f', '#1b4332', '#081c15'],
  },
  {
    id: 'dusk',
    name: 'Dusk',
    colors: ['#ffd6ff', '#e7c6ff', '#c8b6ff', '#b8c0ff', '#bbd0ff', '#98c1d9'],
  },
  {
    id: 'neon',
    name: 'Neon',
    colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3'],
  },
  {
    id: 'gold',
    name: 'Gold',
    colors: ['#fff3b0', '#fee440', '#f5a623', '#e07000', '#9c4a00', '#4a2000'],
  },
]

/** Returns the hex color with the lowest perceived luminance. */
export function getDarkestColor(colors: string[]): string {
  return colors.reduce((darkest, color) => {
    return luminance(color) < luminance(darkest) ? color : darkest
  })
}

/** Returns the hex color with the highest perceived luminance. */
export function getLightestColor(colors: string[]): string {
  return colors.reduce((lightest, color) => {
    return luminance(color) > luminance(lightest) ? color : lightest
  })
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
