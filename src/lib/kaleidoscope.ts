// src/lib/kaleidoscope.ts

export interface TriangleState {
  cx: number    // center x in SVG coordinate space (0–500)
  cy: number    // center y in SVG coordinate space (0–500)
  angle: number // rotation in radians
  size: number  // distance from center to vertex in SVG units
}

export interface KaleidoscopeOptions {
  canvas: HTMLCanvasElement
  offscreenCanvas: HTMLCanvasElement   // has the rasterized SVG drawn into it
  triangle: TriangleState
  sectors: number
  flip: boolean
}

interface Point { x: number; y: number }
interface Affine { a: number; b: number; c: number; d: number; e: number; f: number }

/**
 * Divides the output square into `sectors` triangular wedges from the center,
 * and fills each wedge by affine-mapping the source triangle into it.
 *
 * The source triangle's three vertices map to:
 *   v[0] → canvas center (apex of every sector)
 *   v[1] → left edge of sector  (swapped on odd sectors when flip=true)
 *   v[2] → right edge of sector
 *
 * This ensures the square is fully tiled — no gaps, no circular crop.
 */
export function renderKaleidoscope(opts: KaleidoscopeOptions): void {
  const { canvas, offscreenCanvas, triangle, sectors, flip } = opts
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width
  const H = canvas.height
  const centerX = W / 2
  const centerY = H / 2

  ctx.clearRect(0, 0, W, H)

  // Scale from SVG coordinate space (500×500) to offscreen canvas pixels
  const SVG_SIZE = 500
  const scaleX = offscreenCanvas.width / SVG_SIZE
  const scaleY = offscreenCanvas.height / SVG_SIZE

  // Source triangle vertices in offscreen canvas pixel space
  // Isoceles: apex at (cx,cy), two legs at angle ± π/sectors
  const half = Math.PI / sectors
  const apexX = triangle.cx * scaleX
  const apexY = triangle.cy * scaleY
  const vSrc: [Point, Point, Point] = [
    { x: apexX, y: apexY },
    { x: apexX + Math.cos(triangle.angle - half) * triangle.size * scaleX,
      y: apexY + Math.sin(triangle.angle - half) * triangle.size * scaleY },
    { x: apexX + Math.cos(triangle.angle + half) * triangle.size * scaleX,
      y: apexY + Math.sin(triangle.angle + half) * triangle.size * scaleY },
  ]

  // Sector radius — extends past all four corners of the square
  const sectorAngle = (Math.PI * 2) / sectors
  const sectorRadius = Math.sqrt(centerX * centerX + centerY * centerY) / Math.cos(sectorAngle / 2)

  for (let i = 0; i < sectors; i++) {
    const θ0 = i * sectorAngle
    const θ1 = (i + 1) * sectorAngle

    const apex: Point  = { x: centerX, y: centerY }
    const edge0: Point = { x: centerX + Math.cos(θ0) * sectorRadius, y: centerY + Math.sin(θ0) * sectorRadius }
    const edge1: Point = { x: centerX + Math.cos(θ1) * sectorRadius, y: centerY + Math.sin(θ1) * sectorRadius }

    // Mirror alternate sectors by swapping the two edge points
    const vDst: [Point, Point, Point] = flip && i % 2 === 1
      ? [apex, edge1, edge0]
      : [apex, edge0, edge1]

    const m = computeAffine(vSrc, vDst)
    if (!m) continue

    ctx.save()

    // Clip to this sector's triangle
    ctx.beginPath()
    ctx.moveTo(apex.x, apex.y)
    ctx.lineTo(edge0.x, edge0.y)
    ctx.lineTo(edge1.x, edge1.y)
    ctx.closePath()
    ctx.clip()

    // Apply affine transform and draw
    ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f)
    ctx.drawImage(offscreenCanvas, 0, 0)

    ctx.restore()
  }

  // Reset transform
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

/**
 * Computes the affine transform matrix that maps src[i] → dst[i] for i = 0,1,2.
 * Returns null if the source triangle is degenerate.
 */
function computeAffine(src: [Point, Point, Point], dst: [Point, Point, Point]): Affine | null {
  const [s0, s1, s2] = src
  const [d0, d1, d2] = dst

  // det of the source triangle basis matrix
  const det =
    s0.x * (s1.y - s2.y) -
    s0.y * (s1.x - s2.x) +
    (s1.x * s2.y - s2.x * s1.y)

  if (Math.abs(det) < 1e-10) return null
  const inv = 1 / det

  const a = inv * (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y))
  const c = inv * (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x))
  const e = inv * (d0.x * (s1.x * s2.y - s2.x * s1.y) + d1.x * (s2.x * s0.y - s0.x * s2.y) + d2.x * (s0.x * s1.y - s1.x * s0.y))

  const b = inv * (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y))
  const d = inv * (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x))
  const f = inv * (d0.y * (s1.x * s2.y - s2.x * s1.y) + d1.y * (s2.x * s0.y - s0.x * s2.y) + d2.y * (s0.x * s1.y - s1.x * s0.y))

  return { a, b, c, d, e, f }
}

/**
 * Rasterizes an SVG string into an offscreen canvas.
 */
export async function rasterizeSVG(svgString: string, width: number, height: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = reject
    img.src = url
  })
}
