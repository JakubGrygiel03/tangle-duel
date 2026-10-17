"use client";

import { useEffect, useRef, useState } from "react";
import { HarpSynth } from "@/lib/audio/synth";
import {
  computeArena,
  placeDragTarget,
  stepNodes,
  type Arena,
  type ArenaChrome,
  type Graph,
  type GraphNode,
  type Point,
} from "@/lib/engine/graph";
import { findIntersections } from "@/lib/engine/intersections";
import { BoardRenderer } from "@/lib/engine/renderer";

const GUIDE = 3;

const UNITS: ReadonlyArray<readonly [number, number]> = [
  [0, -0.7],
  [0.72, 0.2],
  [0, 0.72],
  [-0.72, 0.08],
  [-0.46, -0.58],
];

const GOAL: readonly [number, number] = [0.34, -0.22];

const EDGES = [
  { a: 0, b: 1 },
  { a: 0, b: 2 },
  { a: 1, b: 3 },
  { a: 4, b: 0 },
];

function tutorialChrome(height: number, chrome?: ArenaChrome): ArenaChrome {
  if (chrome && chrome.top > 8 && chrome.bottom > 8) return chrome;
  return {
    top: Math.min(96, Math.max(64, height * 0.1)),
    bottom: Math.min(240, Math.max(150, height * 0.24)),
  };
}

function project(unit: readonly [number, number], arena: Arena): Point {
  return {
    x: arena.cx + unit[0] * arena.radius * 0.78,
    y: arena.cy + unit[1] * arena.radius * 0.78,
  };
}

function makeGraph(width: number, height: number, chrome?: ArenaChrome): { graph: Graph; goal: Point } {
  const arena = computeArena(width, height, tutorialChrome(height, chrome));
  const nodes: GraphNode[] = UNITS.map((unit, id) => {
    const point = project(unit, arena);
    return { id, x: point.x, y: point.y, tx: point.x, ty: point.y, pluck: 0, grab: 0 };
  });
  return {
    graph: { nodes, edges: EDGES, arena, level: 0, minimumMoves: 1 },
    goal: project(GOAL, arena),
  };
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
}

export function TutorialBoard({
  muted,
  haptics,
  firstVisit,
  onSkip,
  onFinish,
}: {
  muted: boolean;
  haptics: boolean;
  firstVisit: boolean;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<HarpSynth | null>(null);
  const [solved, setSolved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [crossed, setCrossed] = useState(true);
  const flags = useRef({ muted, haptics });

  useEffect(() => {
    flags.current = { muted, haptics };
    synthRef.current?.setMuted(muted);
  }, [muted, haptics]);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const synth = new HarpSynth();
    synth.setMuted(flags.current.muted);
    synthRef.current = synth;
    const renderer = new BoardRenderer();

    let width = 1;
    let height = 1;
    const built = makeGraph(width, height);
    const graph = built.graph;
    let goal = built.goal;
    let pointerId: number | null = null;
    let holding = false;
    let done = false;
    let celebrate = 0;
    let publishedCross = true;
    let time = 0;
    let last = performance.now();
    let running = true;
    let raf = 0;

    const readChrome = (): ArenaChrome | undefined => {
      const header = headerRef.current;
      const card = cardRef.current;
      if (!header || !card) return undefined;
      const rect = frame.getBoundingClientRect();
      const top = header.getBoundingClientRect().bottom - rect.top;
      const bottom = rect.bottom - card.getBoundingClientRect().top;
      if (top < 8 || bottom < 8) return undefined;
      return { top, bottom };
    };

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.max(1, rect.width);
      const nextH = Math.max(1, rect.height);
      const previous = graph.arena;
      const next = computeArena(nextW, nextH, tutorialChrome(nextH, readChrome()));
      const scale = previous.radius > 0 ? next.radius / previous.radius : 1;
      for (const node of graph.nodes) {
        node.x = next.cx + (node.x - previous.cx) * scale;
        node.y = next.cy + (node.y - previous.cy) * scale;
        node.tx = next.cx + (node.tx - previous.cx) * scale;
        node.ty = next.cy + (node.ty - previous.cy) * scale;
      }
      goal = {
        x: next.cx + (goal.x - previous.cx) * scale,
        y: next.cy + (goal.y - previous.cy) * scale,
      };
      graph.arena = next;
      width = nextW;
      height = nextH;
      const bufferW = Math.max(1, Math.round(width * dpr));
      const bufferH = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== bufferW || canvas.height !== bufferH) {
        canvas.width = bufferW;
        canvas.height = bufferH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const localPoint = (event: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const paintHint = (guide: GraphNode | undefined, bloom: number) => {
      if (!guide || done || bloom > 0.2) return;
      const pulse = 0.5 + 0.5 * Math.sin(time * 3.2);
      ctx.beginPath();
      ctx.arc(guide.x, guide.y, 28 + pulse * 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(249, 115, 22, ${0.35 + pulse * 0.45})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#e0f2fe";
      drawDiamond(ctx, goal.x, goal.y, 7);
      ctx.fill();
      ctx.restore();

      if (holding) return;
      const travel = (Math.sin(time * 1.35) + 1) / 2;
      const eased = travel * travel * (3 - 2 * travel);
      const fx = guide.x + (goal.x - guide.x) * eased;
      const fy = guide.y + (goal.y - guide.y) * eased;
      ctx.beginPath();
      ctx.moveTo(guide.x, guide.y);
      ctx.lineTo(goal.x, goal.y);
      ctx.strokeStyle = "rgba(224, 242, 254, 0.28)";
      ctx.setLineDash([4, 7]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(fx, fy, 11, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(224, 242, 254, 0.92)";
      ctx.shadowColor = "rgba(224, 242, 254, 0.8)";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#0b1020";
      ctx.fill();
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      stepNodes(graph.nodes, dt, holding ? GUIDE : null);
      const hits = findIntersections(graph.nodes, graph.edges);
      const clear = hits.length === 0;
      if (clear && !done) {
        done = true;
        celebrate = now;
        publishedCross = false;
        setSolved(true);
        setCrossed(false);
        try {
          synth.victoryChord();
        } catch {
          // Brak dźwięku nie zatrzymuje lekcji.
        }
      } else if (!done && (hits.length > 0) !== publishedCross) {
        publishedCross = hits.length > 0;
        setCrossed(publishedCross);
      }
      const bloom = done ? Math.max(0, 1 - (now - celebrate) / 1400) : 0;
      renderer.draw(ctx, { graph, hits, time, bloom, width, height });
      paintHint(graph.nodes[GUIDE], bloom);
      raf = requestAnimationFrame(tick);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (done || pointerId !== null || event.button !== 0) return;
      const point = localPoint(event);
      const guide = graph.nodes[GUIDE];
      if (!guide || Math.hypot(guide.x - point.x, guide.y - point.y) > 48) return;
      pointerId = event.pointerId;
      holding = true;
      setDragging(true);
      canvas.setPointerCapture(event.pointerId);
      const target = placeDragTarget(graph.nodes, GUIDE, point.x, point.y, graph.arena);
      guide.tx = target.x;
      guide.ty = target.y;
      if (flags.current.haptics) navigator.vibrate?.(10);
      synth.unlock();
      synth.touchNode(GUIDE);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!holding || pointerId !== event.pointerId) return;
      const guide = graph.nodes[GUIDE];
      if (!guide) return;
      const point = localPoint(event);
      const target = placeDragTarget(graph.nodes, GUIDE, point.x, point.y, graph.arena);
      guide.tx = target.x;
      guide.ty = target.y;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      pointerId = null;
      holding = false;
      setDragging(false);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    if (headerRef.current) observer.observe(headerRef.current);
    if (cardRef.current) observer.observe(cardRef.current);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      synthRef.current = null;
      void synth.close();
    };
  }, []);

  const line = solved
    ? "Tak. Nic się nie krzyżuje."
    : dragging
      ? "Puść przy jasnym punkcie."
      : crossed
        ? "Złap kryształ w kółku i przesuń do jasnego punktu."
        : "Puść, gdy nić zrobi się biała.";

  return (
    <div className="game-shell fixed inset-0 flex items-center justify-center bg-[#09090b] text-[#e0f2fe]">
      <div ref={frameRef} className="relative h-[100dvh] w-full max-w-[calc(100dvh*9/16)] overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          role="application"
          aria-label="Nauka. Przeciągnij kryształ w kółku do jasnego punktu, aż nici przestaną się krzyżować."
        />
        <div className="pointer-events-none absolute inset-0">
          <div
            ref={headerRef}
            className="flex items-center justify-between px-5 pt-[max(0.85rem,env(safe-area-inset-top))]"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.42em] text-[#e0f2fe]/55">
              Nauka
            </p>
            <button
              type="button"
              onClick={onSkip}
              className="pointer-events-auto h-11 px-2 text-sm text-[#e0f2fe]/75"
            >
              Pomiń
            </button>
          </div>
          <div ref={cardRef} className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="rounded-[1.4rem] border border-[#e0f2fe]/15 bg-[#09090b]/72 px-5 py-4 backdrop-blur-md">
              <p className="text-lg font-light leading-snug">{line}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#e0f2fe]/55">
                Pomarańczowa nić się krzyżuje. Biała jest wolna.
              </p>
              {solved && (
                <button
                  type="button"
                  onClick={onFinish}
                  className="pointer-events-auto mt-4 h-14 w-full rounded-[1.1rem] bg-[linear-gradient(180deg,#f8fbff_0%,#d5eaf6_100%)] text-base font-medium text-[#0b1020]"
                >
                  {firstVisit ? "Gram" : "Wracam"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
