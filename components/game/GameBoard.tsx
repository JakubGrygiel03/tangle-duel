"use client";

import { useEffect, useRef, useState } from "react";
import { HarpSynth } from "@/lib/audio/synth";
import {
  createLevel,
  fitGraph,
  isDegenerate,
  pickNode,
  placeDragTarget,
  stepNodes,
  type Graph,
} from "@/lib/engine/graph";
import { findIntersections } from "@/lib/engine/intersections";
import { BoardRenderer } from "@/lib/engine/renderer";

const VICTORY_MS = 1500;
const INTRO_MS = 1100;

export function GameBoard() {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<HarpSynth | null>(null);
  const [level, setLevel] = useState(1);
  const [crossings, setCrossings] = useState<number | null>(null);
  const [minMoves, setMinMoves] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [canvasError, setCanvasError] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      setCanvasError(true);
      return;
    }

    const synth = new HarpSynth();
    synthRef.current = synth;
    const renderer = new BoardRenderer();

    let graph: Graph | null = null;
    let width = 0;
    let height = 0;
    let levelNum = 1;
    let dragging: number | null = null;
    let pointerId: number | null = null;
    let celebrating = false;
    let celebrateStart = 0;
    let introUntil = 0;
    let lastCross: number | null = null;
    let lastMoves: number | null = null;
    let last = performance.now();
    let time = 0;
    let raf = 0;
    let running = true;

    const publishCrossings = (count: number) => {
      if (count === lastCross) return;
      lastCross = count;
      setCrossings(count);
    };

    const publishMoves = (count: number) => {
      if (count === lastMoves) return;
      lastMoves = count;
      setMinMoves(count);
    };

    const paint = (hits: ReturnType<typeof findIntersections>, bloom: number) => {
      if (!graph) return;
      renderer.draw(ctx, { graph, hits, time, bloom, width, height });
    };

    const nodesSettled = (current: Graph) =>
      current.nodes.every((node) => Math.hypot(node.tx - node.x, node.ty - node.y) < 0.8);

    const mountLevel = (nextLevel: number, intro: boolean) => {
      levelNum = nextLevel;
      const next = createLevel(nextLevel, width, height);
      if (intro) {
        const pull = 0.62;
        for (const node of next.nodes) {
          node.x = next.arena.cx + (node.tx - next.arena.cx) * pull;
          node.y = next.arena.cy + (node.ty - next.arena.cy) * pull;
        }
        introUntil = performance.now() + INTRO_MS;
      } else {
        introUntil = 0;
      }
      graph = next;
      dragging = null;
      pointerId = null;
      celebrating = false;
      const hits = findIntersections(graph.nodes, graph.edges);
      publishCrossings(hits.length);
      publishMoves(next.minimumMoves);
      setLevel(nextLevel);
      setCleared(false);
      paint(hits, intro ? 0.35 : 0);
    };

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const bufferW = Math.max(1, Math.round(width * dpr));
      const bufferH = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== bufferW || canvas.height !== bufferH) {
        canvas.width = bufferW;
        canvas.height = bufferH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!graph) mountLevel(levelNum, false);
      else fitGraph(graph, width, height);

      if (graph) {
        const hits = findIntersections(graph.nodes, graph.edges);
        const bloom = celebrating ? Math.min(1, (performance.now() - celebrateStart) / VICTORY_MS) : 0;
        paint(hits, bloom);
      }
    };

    const frameTick = (now: number) => {
      if (!running) return;
      try {
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        time += dt;

        if (graph) {
          stepNodes(graph.nodes, dt, celebrating ? null : dragging);
          const hits = findIntersections(graph.nodes, graph.edges);
          const flying = now < introUntil || !nodesSettled(graph);
          const solved = hits.length === 0 && !isDegenerate(graph.nodes);

          if (!celebrating && !flying && solved) {
            celebrating = true;
            celebrateStart = now;
            dragging = null;
            pointerId = null;
            setCleared(true);
            try {
              synth.victoryChord();
            } catch {
              // Synteza jest ozdobą. Plansza działa też w ciszy.
            }
          }

          publishCrossings(hits.length);
          let bloom = 0;
          if (celebrating) bloom = Math.min(1, (now - celebrateStart) / VICTORY_MS);
          else if (introUntil > now) bloom = Math.max(0, (introUntil - now) / INTRO_MS) * 0.45;
          paint(hits, bloom);

          if (celebrating && now - celebrateStart >= VICTORY_MS) {
            mountLevel(levelNum + 1, true);
          }
        } else {
          ctx.fillStyle = "#09090b";
          ctx.fillRect(0, 0, width, height);
        }
      } catch {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } finally {
        if (running) raf = requestAnimationFrame(frameTick);
      }
    };

    const pointFrom = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.cancelable) event.preventDefault();
      synth.unlock();
      if (!graph || celebrating || pointerId !== null) return;

      const point = pointFrom(event);
      const id = pickNode(graph.nodes, point.x, point.y);
      if (id < 0) return;

      const node = graph.nodes[id];
      if (!node) return;

      pointerId = event.pointerId;
      dragging = id;
      node.pluck = 1;
      const target = placeDragTarget(graph.nodes, id, point.x, point.y, width, height);
      node.tx = target.x;
      node.ty = target.y;
      synth.touchNode(id);
      setHintVisible(false);

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Ruch i tak śledzimy na oknie.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId || !graph || celebrating) return;
      if (dragging === null) return;
      if (event.cancelable) event.preventDefault();
      const node = graph.nodes[dragging];
      if (!node) return;
      const point = pointFrom(event);
      const target = placeDragTarget(graph.nodes, node.id, point.x, point.y, width, height);
      node.tx = target.x;
      node.ty = target.y;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      pointerId = null;
      dragging = null;
    };

    const preventTouch = (event: TouchEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("button")) return;
      if (event.cancelable) event.preventDefault();
    };

    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    frame.addEventListener("touchstart", preventTouch, { passive: false });
    frame.addEventListener("touchmove", preventTouch, { passive: false });
    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });

    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    window.visualViewport?.addEventListener("resize", resize);
    resize();
    raf = requestAnimationFrame(frameTick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      frame.removeEventListener("touchstart", preventTouch);
      frame.removeEventListener("touchmove", preventTouch);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      synthRef.current = null;
      void synth.close();
    };
  }, []);

  const calm = crossings === 0;

  return (
    <div className="game-shell fixed inset-0 flex items-center justify-center overflow-hidden bg-[#09090b] text-[#e0f2fe]">
      <div
        ref={frameRef}
        className="relative h-[100dvh] w-full max-w-[calc(100dvh*9/16)] overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full touch-none"
          role="application"
          aria-label="Plansza Tangle Duel. Przeciągnij kryształy, aby rozplątać struny."
        />

        <div className="pointer-events-none absolute inset-0">
          <header className="px-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.42em] text-[#e0f2fe]/45">
              Tangle Duel
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <HudStat label="Poziom" value={level} />
              <HudStat
                label="Przecięcia"
                value={crossings === null ? "—" : crossings}
                tone={calm ? "ice" : "amber"}
                align="center"
              />
              <HudStat label="Min. ruchy" value={minMoves === null ? "—" : minMoves} align="end" />
            </div>
          </header>

          {hintVisible && !canvasError && (
            <p className="hint-in absolute inset-x-8 bottom-[max(5.75rem,calc(env(safe-area-inset-bottom)+4.75rem))] text-center text-sm font-light leading-relaxed text-[#e0f2fe]/75">
              Przeciągnij kryształy, aż struny
              <br />
              przestaną się przecinać.
            </p>
          )}

          {cleared && (
            <p className="hint-in absolute inset-x-4 top-[18%] text-center text-2xl font-light tracking-[0.16em] text-white">
              Rozplątane
            </p>
          )}

          {canvasError && (
            <p className="absolute inset-x-8 top-1/2 -translate-y-1/2 text-center text-sm font-light text-[#fecaca]">
              Ta przeglądarka nie udostępniła płótna. Otwórz grę w aktualnym Safari lub Chrome.
            </p>
          )}

          <button
            type="button"
            aria-pressed={muted}
            aria-label={muted ? "Włącz dźwięk" : "Wycisz dźwięk"}
            onClick={() => {
              const next = !muted;
              setMuted(next);
              synthRef.current?.unlock();
              synthRef.current?.setMuted(next);
            }}
            className="pointer-events-auto absolute right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] grid h-11 w-11 place-items-center rounded-full border border-[#e0f2fe]/20 bg-black/35 text-[#e0f2fe] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0f2fe]"
          >
            <SpeakerIcon muted={muted} />
          </button>
        </div>
      </div>
    </div>
  );
}

function HudStat({
  label,
  value,
  tone = "ice",
  align = "start",
}: {
  label: string;
  value: number | string;
  tone?: "ice" | "amber";
  align?: "start" | "center" | "end";
}) {
  const alignClass =
    align === "end" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <div className={alignClass}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#e0f2fe]/55">{label}</p>
      <p
        className={`mt-1 text-3xl font-light leading-none tabular-nums ${
          tone === "amber" ? "text-[#f97316]" : "text-[#e0f2fe]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none">
      <path
        d="M3 7.2h2.2L9 4.2v9.6L5.2 10.8H3V7.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {muted ? (
        <path d="M12 7.2 16 11.2M16 7.2 12 11.2" stroke="currentColor" strokeWidth="1.2" />
      ) : (
        <path
          d="M12 6.4c1.2.8 1.2 4.4 0 5.2M13.8 4.8c2 1.6 2 6.8 0 8.4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
