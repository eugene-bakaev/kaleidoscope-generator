"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { PrimitiveSelector } from "@/components/controls/PrimitiveSelector";
import { PaletteSelector } from "@/components/controls/PaletteSelector";
import { DensityControls } from "@/components/controls/DensityControls";
import { BaseImageSVG } from "@/components/base-image/BaseImageSVG";
import { TriangleSelector } from "@/components/base-image/TriangleSelector";
import { KaleidoscopeCanvas } from "@/components/kaleidoscope/KaleidoscopeCanvas";
import { SectorControls } from "@/components/kaleidoscope/SectorControls";
import { generateImage } from "@/lib/generateImage";
import {
  renderKaleidoscope,
  rasterizeSVG,
  type TriangleState,
} from "@/lib/kaleidoscope";
import { PALETTES, getLightestColor, type Palette } from "@/lib/palette";
import type {
  PrimitiveType,
  PrimitiveDescriptor,
} from "@/lib/primitives/types";

const SVG_SIZE = 500;
const INITIAL_SECTORS = 8;
const ROTATE_STEP = (5 * Math.PI) / 180;

const triangleSizeForSectors = (n: number) =>
  (SVG_SIZE / 2) * Math.tan(Math.PI / n);

const INITIAL_TRIANGLE: TriangleState = {
  cx: SVG_SIZE / 2,
  cy: SVG_SIZE / 2,
  angle: 0,
  size: triangleSizeForSectors(INITIAL_SECTORS),
};

export default function BuilderPage() {
  const [enabledTypes, setEnabledTypes] = useState<PrimitiveType[]>([
    "circles",
    "dots",
    "lines",
    "polygons",
  ]);
  const [palette, setPalette] = useState<Palette>(PALETTES[0]);
  const [count, setCount] = useState(10);
  const [complexity, setComplexity] = useState(0.5);
  const [descriptors, setDescriptors] = useState<PrimitiveDescriptor[]>(() =>
    generateImage({
      enabledTypes: ["circles", "dots", "lines", "polygons"],
      palette: PALETTES[0],
      count: 10,
      complexity: 0.5,
      seed: 1,
    }),
  );
  const [triangle, setTriangle] = useState<TriangleState>(INITIAL_TRIANGLE);
  const [sectors, setSectors] = useState(INITIAL_SECTORS);
  const [flip, setFlip] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [interval, setInterval_] = useState(100);
  const intervalRef = useRef(100);

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const triangleRef = useRef(triangle);
  const sectorsRef = useRef(sectors);
  const flipRef = useRef(flip);

  // Keep refs in sync with state
  useEffect(() => {
    triangleRef.current = triangle;
  }, [triangle]);
  useEffect(() => {
    sectorsRef.current = sectors;
  }, [sectors]);
  useEffect(() => {
    flipRef.current = flip;
  }, [flip]);
  useEffect(() => {
    intervalRef.current = interval;
  }, [interval]);

  const background = getLightestColor(palette.colors);

  const handleGenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 0xffffffff);
    setDescriptors(
      generateImage({
        enabledTypes,
        palette,
        count,
        complexity,
        seed: newSeed,
      }),
    );
  }, [enabledTypes, palette, count, complexity]);

  const handleSectorsChange = useCallback((s: number) => {
    setSectors(s);
    setTriangle((t) => ({ ...t, size: triangleSizeForSectors(s) }));
  }, []);

  const prepareCanvas =
    useCallback(async (): Promise<HTMLCanvasElement | null> => {
      const canvas = canvasRef.current;
      const svg = svgRef.current;
      if (!canvas || !svg) return null;
      const dpr = (window.devicePixelRatio || 1) * 2;
      const cssSize =
        Math.min(canvas.clientWidth, canvas.clientHeight) || SVG_SIZE;
      const px = Math.round(cssSize * dpr);
      canvas.width = px;
      canvas.height = px;
      const svgString = new XMLSerializer().serializeToString(svg);
      return rasterizeSVG(svgString, px, px);
    }, []);

  const handleApply = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsApplying(true);
    try {
      const offscreen = await prepareCanvas();
      if (!offscreen) return;
      offscreenRef.current = offscreen;
      renderKaleidoscope({
        canvas,
        offscreenCanvas: offscreen,
        triangle,
        sectors,
        flip,
      });
    } finally {
      setIsApplying(false);
    }
  }, [triangle, sectors, flip, prepareCanvas]);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    // Rasterize SVG once before starting playback
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsApplying(true);
    try {
      const offscreen = await prepareCanvas();
      if (!offscreen) return;
      offscreenRef.current = offscreen;
    } finally {
      setIsApplying(false);
    }
    setIsPlaying(true);
  }, [isPlaying, prepareCanvas]);

  // Animation loop — runs when isPlaying, restarts when interval changes
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      const next: TriangleState = {
        ...triangleRef.current,
        angle: triangleRef.current.angle + ROTATE_STEP,
      };
      triangleRef.current = next;
      setTriangle(next);
      const canvas = canvasRef.current;
      const offscreen = offscreenRef.current;
      if (canvas && offscreen) {
        renderKaleidoscope({
          canvas,
          offscreenCanvas: offscreen,
          triangle: next,
          sectors: sectorsRef.current,
          flip: flipRef.current,
        });
      }
    }, intervalRef.current);
    return () => window.clearInterval(id);
  }, [isPlaying, interval]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center px-6 py-3 border-b border-neutral-800">
        <h1 className="text-sm font-semibold tracking-widest text-neutral-300 uppercase">
          Kaleidoscope
        </h1>
      </header>

      {/* Three-column layout */}
      <div className="flex-1 grid grid-cols-[220px_1fr_1fr] overflow-hidden">
        {/* Left panel — controls */}
        <aside className="flex flex-col gap-6 p-4 border-r border-neutral-800 overflow-y-auto">
          <PrimitiveSelector
            selected={enabledTypes}
            onChange={setEnabledTypes}
          />
          <PaletteSelector selected={palette} onChange={setPalette} />
          <DensityControls
            count={count}
            complexity={complexity}
            onCountChange={setCount}
            onComplexityChange={setComplexity}
          />
          <button
            onClick={handleGenerate}
            className="mt-auto bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 rounded transition-colors"
          >
            Generate
          </button>
        </aside>

        {/* Center panel — base image + triangle selector */}
        <section className="flex flex-col p-4 border-r border-neutral-800 gap-3 overflow-hidden">
          <span className="label">Base Image</span>
          <div className="relative flex-1 bg-neutral-900 rounded overflow-hidden">
            <BaseImageSVG
              descriptors={descriptors}
              background={background}
              svgRef={svgRef}
            />
            <div className="absolute inset-0">
              <TriangleSelector
                state={triangle}
                onChange={setTriangle}
                svgSize={SVG_SIZE}
                sectors={sectors}
              />
            </div>
          </div>
        </section>

        {/* Right panel — kaleidoscope */}
        <section className="flex flex-col p-4 gap-3 overflow-hidden">
          <span className="label">Kaleidoscope</span>
          <div className="flex-1 bg-neutral-900 rounded overflow-hidden flex items-center justify-center">
            <KaleidoscopeCanvas ref={canvasRef} />
          </div>
          <SectorControls
            sectors={sectors}
            flip={flip}
            onSectorsChange={handleSectorsChange}
            onFlipChange={setFlip}
          />
          <div className="flex flex-col gap-1">
            <label className="label flex justify-between">
              <span>Interval</span>
              <span className="text-neutral-400">{interval}ms</span>
            </label>
            <input
              type="range"
              min={50}
              max={1000}
              step={50}
              value={interval}
              onChange={e => setInterval_(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              disabled={isApplying || isPlaying}
              className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors"
            >
              {isApplying ? "Rendering…" : "Apply"}
            </button>
            <button
              onClick={handlePlay}
              disabled={isApplying}
              className="flex-1 bg-violet-800 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors"
            >
              {isPlaying ? "Stop" : "Play"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
