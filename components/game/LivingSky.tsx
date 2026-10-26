"use client";

import { useEffect, useRef } from "react";
import { computeArena, type Arena, type ArenaChrome, type Graph, type GraphEdge, type GraphNode } from "@/lib/engine/graph";
import { findIntersections } from "@/lib/engine/intersections";
import { BoardRenderer } from "@/lib/engine/renderer";
import { getTheme, type VisualTheme } from "@/lib/engine/themes";

type Unit = readonly [number, number];
type Pose = ReadonlyArray<Unit>;

const CLEAR: Pose = [
  [0, -0.78],
  [0.74, -0.24],
  [0.46, 0.64],
  [-0.46, 0.64],
  [-0.74, -0.24],
  [0, 0.02],
];

/** Splątanie: węzły 1 i 3 zamienione miejscami. */
const TANGLE: Pose = [
  [0, -0.78],
  [-0.46, 0.64],
  [0.46, 0.64],
  [0.74, -0.24],
  [-0.74, -0.24],
  [0, 0.02],
];

/** Po drodze jeden kryształ stoi z boku — jak przy przeciągnięciu jednym palcem. */
const ASIDE: Pose = [
  [0, -0.78],
  [0.18, -0.32],
  [0.46, 0.64],
  [0.74, -0.24],
  [-0.74, -0.24],
  [0, 0.02],
];

/**
 * Połowa 3 już w domu, 1 jeszcze z boku.
 * Kolejność ruchów: jeden węzeł naraz.
 */
const HALF: Pose = [
  [0, -0.78],
  [0.18, -0.32],
  [0.46, 0.64],
  [-0.46, 0.64],
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

/** Odcinki pętli: jeden ruch = jeden węzeł. */
const SEGMENTS: ReadonlyArray<{ from: Pose; to: Pose; hold: number; move: number }> = [
  { from: TANGLE, to: TANGLE, hold: 1.15, move: 0 },
  { from: TANGLE, to: ASIDE, hold: 0.28, move: 0.95 },
  { from: ASIDE, to: HALF, hold: 0.28, move: 0.95 },
  { from: HALF, to: CLEAR, hold: 0.28, move: 0.95 },
  { from: CLEAR, to: CLEAR, hold: 1.35, move: 0 },
  { from: CLEAR, to: HALF, hold: 0.28, move: 0.95 },
  { from: HALF, to: ASIDE, hold: 0.28, move: 0.95 },
  { from: ASIDE, to: TANGLE, hold: 0.28, move: 0.95 },
];

const CYCLE = SEGMENTS.reduce((sum, part) => sum + part.hold + part.move, 0);

function smooth(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function poseAt(time: number, reduced: boolean): Pose {
  if (reduced) return TANGLE;
  let cursor = ((time % CYCLE) + CYCLE) % CYCLE;
  for (const part of SEGMENTS) {
    if (cursor < part.hold) return part.from;
    cursor -= part.hold;
    if (part.move <= 0) continue;
    if (cursor < part.move) {
      const t = smooth(cursor / part.move);
      return part.from.map((start, id) => {
        const end = part.to[id] ?? start;
        return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t] as const;
      });
    }
    cursor -= part.move;
  }
  return TANGLE;
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
  // Trochę mniejszy okrąg niż pełny slot między tytułem a CTA — zostawia oddech.
  const arena = computeArena(width, height, { top, bottom });
  return { ...arena, radius: arena.radius * 0.82 };
}

function buildGraph(arena: Arena, pose: Pose): Graph {
  const nodes: GraphNode[] = pose.map((unit, id) => {
    const x = arena.cx + unit[0] * arena.radius * 0.8;
    const y = arena.cy + unit[1] * arena.radius * 0.8;
    return { id, x, y, tx: x, ty: y, pluck: 0, grab: 0 };
  });
  return { nodes, edges: EDGES, arena, level: 0, minimumMoves: 0 };
}

export function LivingSky({
  mood,
  band,
  theme,
}: {
  mood: "menu" | "calm";
  band?: ArenaChrome;
  theme?: VisualTheme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bandRef = useRef(band);
  const themeRef = useRef(theme ?? getTheme("dusk"));

  useEffect(() => {
    bandRef.current = band;
  }, [band]);

  useEffect(() => {
    themeRef.current = theme ?? getTheme("dusk");
  }, [theme]);

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
      const graph = buildGraph(arenaFor(width, height, mood, bandRef.current), poseAt(time, reduced));
      const hits = findIntersections(graph.nodes, graph.edges);
      renderer.draw(ctx, { graph, hits, time, bloom: 0, width, height, theme: themeRef.current });
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
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
    />
  );
}
