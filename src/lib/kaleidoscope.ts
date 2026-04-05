// src/lib/kaleidoscope.ts

export interface TriangleState {
  cx: number    // center x in SVG coordinate space (0–500)
  cy: number    // center y in SVG coordinate space (0–500)
  angle: number // rotation in radians
  size: number  // distance from center to tip in SVG units
}

export interface KaleidoscopeOptions {
  canvas: HTMLCanvasElement
  offscreenCanvas: HTMLCanvasElement   // has the rasterized SVG drawn into it
  triangle: TriangleState
  sectors: number
  flip: boolean
}

/**
 * Renders the kaleidoscope onto `canvas` using the rasterized base image
 * from `offscreenCanvas` and the triangle selector state.
 */
export function renderKaleidoscope(opts: KaleidoscopeOptions): void {
  const { canvas, offscreenCanvas, triangle, sectors, flip } = opts
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width
  const H = canvas.height
  const cx = W / 2
  const cy = H / 2

  ctx.clearRect(0, 0, W, H)

  // Scale factor from SVG coordinate space (500×500) to canvas pixel space
  const SVG_SIZE = 500
  const scaleX = offscreenCanvas.width / SVG_SIZE
  const scaleY = offscreenCanvas.height / SVG_SIZE

  // Triangle center in offscreen canvas pixel space — used as the draw/clip anchor
  const originX = triangle.cx * scaleX
  const originY = triangle.cy * scaleY

  // Triangle vertices in offscreen canvas pixel space
  const v = triangleVertices(triangle, scaleX, scaleY)

  for (let i = 0; i < sectors; i++) {
    ctx.save()
    // Place the triangle center at the canvas center
    ctx.translate(cx, cy)
    ctx.rotate((i / sectors) * Math.PI * 2)
    if (flip && i % 2 === 1) {
      ctx.scale(-1, 1)
    }

    // Clip to triangle path, offset so the triangle center sits at the origin
    ctx.beginPath()
    ctx.moveTo(v[0].x - originX, v[0].y - originY)
    ctx.lineTo(v[1].x - originX, v[1].y - originY)
    ctx.lineTo(v[2].x - originX, v[2].y - originY)
    ctx.closePath()
    ctx.clip()

    // Draw the offscreen canvas so the triangle center aligns with the origin
    ctx.drawImage(offscreenCanvas, -originX, -originY)

    ctx.restore()
  }
}

function triangleVertices(
  t: TriangleState,
  scaleX: number,
  scaleY: number
): { x: number; y: number }[] {
  const angles = [t.angle, t.angle + (Math.PI * 2) / 3, t.angle + (Math.PI * 4) / 3]
  return angles.map(a => ({
    x: t.cx * scaleX + Math.cos(a) * t.size * scaleX,
    y: t.cy * scaleY + Math.sin(a) * t.size * scaleY,
  }))
}

/**
 * Rasterizes an SVG string into an offscreen canvas.
 * Returns a Promise that resolves with the canvas.
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
