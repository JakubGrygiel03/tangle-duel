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

export function GameBoard() {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<HarpSynth | null>(null);
  const [level, setLevel] = useState(1);
  const [crossings, setCrossings] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [canvasError, setCanvasError] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
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
    let lastCross: number | null = null;
    let last = performance.now();
    let time = 0;
    let raf = 0;
    let running = true;

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!graph) startLevel(levelNum);
      else fitGraph(graph, width, height);
    };

    const startLevel = (nextLevel: number) => {
      levelNum = nextLevel;
      graph = createLevel(nextLevel, width, height);
      dragging = null;
      pointerId = null;
      celebrating = false;
      const hits = findIntersections(graph.nodes, graph.edges);
      publishCrossings(hits.length);
      setLevel(nextLevel);
      setCleared(false);
    };

    const publishCrossings = (count: number) => {
      if (count === lastCross) return;
      lastCross = count;
      setCrossings(count);
    };

    const frameTick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      time += dt;

      if (graph) {
        stepNodes(graph.nodes, dt, celebrating ? null : dragging);
        const hits = findIntersections(graph.nodes, graph.edges);
        const solved = hits.length === 0 && !isDegenerate(graph.nodes);

        if (!celebrating && solved) {
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
        const bloom = celebrating ? Math.min(1, (now - celebrateStart) / VICTORY_MS) : 0;
        renderer.draw(ctx, { graph, hits, time, bloom, width, height });

        if (celebrating && now - celebrateStart >= VICTORY_MS) {
          startLevel(levelNum + 1);
        }
      }

      raf = requestAnimationFrame(frameTick);
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
          <header className="flex items-start justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-[#e0f2fe]/45">
                Tangle Duel
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-[#e0f2fe]/55">
                Poziom
              </p>
              <p className="mt-1 text-3xl font-light leading-none tabular-nums">{level}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#e0f2fe]/55">
                Przecięcia
              </p>
              <p
                className={`mt-1 text-3xl font-light leading-none tabular-nums ${
                  calm ? "text-[#e0f2fe]" : "text-[#f97316]"
                }`}
              >
                {crossings === null ? "—" : crossings}
              </p>
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
