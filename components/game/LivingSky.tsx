"use client";

import { useEffect, useRef } from "react";
import { computeArena, type Arena, type ArenaChrome, type Graph, type GraphEdge, type GraphNode } from "@/lib/engine/graph";
import { findIntersections } from "@/lib/engine/intersections";
import { BoardRenderer } from "@/lib/engine/renderer";

const HOME: ReadonlyArray<readonly [number, number]> = [
  [0, -0.78],
  [0.74, -0.24],
  [0.46, 0.64],
  [-0.46, 0.64],
  [-0.74, -0.24],
  [0, 0.02],
];

const TANGLED: ReadonlyArray<readonly [number, number]> = [
  [0, -0.78],
  [-0.46, 0.64],
  [0.46, 0.64],
  [0.74, -0.24],
  [-0.74, -0.24],
  [0, 0.02],
];

const EDGES: GraphEdge[] = [
  { a: 0, b: 1 },
  { a: 1, b: 2 },
  { a: 2, b: 3 },
  { a: 3, b: 4 },
  { a: 4, b: 0 },
  { a: 5, b: 0 },
  { a: 5, b: 2 },
];

function smooth(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

/** 1 = splątane, 0 = rozplątane. Krótka pauza na czystym układzie. */
function tangleAmount(time: number, reduced: boolean): number {
  if (reduced) return 1;
  const phase = (time % 9) / 9;
  if (phase < 0.4) return 1 - smooth(phase / 0.4);
  if (phase < 0.58) return 0;
  return smooth((phase - 0.58) / 0.42);
}

function arenaFor(
  width: number,
  height: number,
  mood: "menu" | "calm",
  band?: ArenaChrome,
): Arena {
  if (mood === "calm") {
    const radius = Math.max(84, Math.min(width * 0.3, height * 0.115));
    const inset = Math.max(28, height * 0.045);
    return { cx: width / 2, cy: height - radius - inset, radius };
  }
  const top = band?.top && band.top > 8 ? band.top : Math.min(height * 0.22, 176);
  const bottom = band?.bottom && band.bottom > 8 ? band.bottom : Math.min(height * 0.28, 210);
  return computeArena(width, height, { top, bottom });
}

function buildGraph(arena: Arena, amount: number): Graph {
  const nodes: GraphNode[] = HOME.map((home, id) => {
    const tangled = TANGLED[id] ?? home;
    const ux = home[0] + (tangled[0] - home[0]) * amount;
    const uy = home[1] + (tangled[1] - home[1]) * amount;
    const x = arena.cx + ux * arena.radius * 0.8;
    const y = arena.cy + uy * arena.radius * 0.8;
    return { id, x, y, tx: x, ty: y, pluck: 0, grab: 0 };
  });
  return { nodes, edges: EDGES, arena, level: 0, minimumMoves: 0 };
}

export function LivingSky({ mood, band }: { mood: "menu" | "calm"; band?: ArenaChrome }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bandRef = useRef(band);

  useEffect(() => {
    bandRef.current = band;
  }, [band]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = canvas?.parentElement;
    if (!canvas || !frame) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const renderer = new BoardRenderer();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 1;
    let height = 1;
    let time = 0;
    let last = performance.now();
    let running = true;
    let raf = 0;

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const bufferW = Math.max(1, Math.round(width * dpr));
      const bufferH = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== bufferW || canvas.height !== bufferH) {
        canvas.width = bufferW;
        canvas.height = bufferH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      const graph = buildGraph(arenaFor(width, height, mood, bandRef.current), tangleAmount(time, reduced));
      const hits = findIntersections(graph.nodes, graph.edges);
      renderer.draw(ctx, { graph, hits, time, bloom: 0, width, height });
      raf = requestAnimationFrame(tick);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [mood]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
