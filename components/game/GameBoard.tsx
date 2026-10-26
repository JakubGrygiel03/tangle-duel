"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeBackdrop } from "@/components/game/ThemeBackdrop";
import { HarpSynth } from "@/lib/audio/synth";
import type { CrystalShapeId, SoundPackId } from "@/lib/engine/economy";
import {
  isConstellationMatched,
  magnetTowardOutline,
  settleNodesTowardOutline,
  snapToOutlineIfClose,
} from "@/lib/engine/constellations";
import {
  CAMPAIGN_LEVELS,
  createLevel,
  createLevelWithSeed,
  fitGraph,
  isDegenerate,
  pickNode,
  placeDragTarget,
  stepNodes,
  type ArenaChrome,
  type Graph,
} from "@/lib/engine/graph";
import { findIntersections } from "@/lib/engine/intersections";
import { BoardRenderer } from "@/lib/engine/renderer";
import { getTheme, themeChromeVars, type VisualTheme } from "@/lib/engine/themes";
import { createTranslator, type TranslateFn } from "@/lib/i18n";

const defaultT = createTranslator("en");

/** Czysty układ musi tyle wytrzymać, zanim poziom się zaliczy. */
const HOLD_MS = 3000;
/** Po zaliczeniu: rozbłysk, akord i przejście dalej. */
const VICTORY_MS = 1500;
const CONSTELLATION_VICTORY_MS = 2200;
const INTRO_MS = 1100;
const RUSH_START_MS = 15_000;
const RUSH_BONUS_MS = 4_000;
const ECHO_REVEAL_MS = 1000;

export type BoardMode = "classic" | "rush" | "master" | "echo";

export type ClearInfo = {
  level: number;
  moves: number;
  minimumMoves: number;
  perfect: boolean;
  constellationName?: string;
  constellationId?: string;
};

type TrailMote = { x: number; y: number; life: number };

type GameBoardProps = {
  level: number;
  muted: boolean;
  haptics: boolean;
  theme?: VisualTheme;
  soundPack?: SoundPackId;
  crystalShape?: CrystalShapeId;
  trail?: boolean;
  mode?: BoardMode;
  /** Wspólny seed pojedynku — ten sam układ na obu urządzeniach. */
  seed?: number;
  /** Po zaliczeniu nie przechodzi dalej (pojedynek / daily / rush koniec). */
  race?: boolean;
  /** Wypełnia rodzica zamiast całego ekranu (split-screen). */
  embed?: boolean;
  /** Obrót 180° pod gracza naprzeciw (couch). */
  inverted?: boolean;
  /** Ukrywa przyciski menu / wycisz — steruje rodzic. */
  hideChrome?: boolean;
  /** Krótsze HUD pod wąski pas split. */
  compact?: boolean;
  label?: string;
  t?: TranslateFn;
  onMenu: () => void;
  onMuted: (muted: boolean) => void;
  onCleared: (info: ClearInfo) => void;
  onAdvance: (level: number) => void;
  /** Koniec biegu Rush (czas się skończył). */
  onRushOver?: (score: number) => void;
  /** Pierwsze spotkanie z konstelacją — kartka wyjaśniająca. */
  constellationIntro?: boolean;
  onConstellationIntroSeen?: () => void;
};

export function GameBoard({
  level: startLevel,
  muted,
  haptics,
  theme,
  soundPack = "harp",
  crystalShape = "diamond",
  trail = false,
  mode = "classic",
  seed,
  race = false,
  embed = false,
  inverted = false,
  hideChrome = false,
  compact = false,
  t = defaultT,
  label,
  onMenu,
  onMuted,
  onCleared,
  onAdvance,
  onRushOver,
  constellationIntro = false,
  onConstellationIntroSeen,
}: GameBoardProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const muteRef = useRef<HTMLButtonElement>(null);
  const synthRef = useRef<HarpSynth | null>(null);
  const [level, setLevel] = useState(startLevel);
  const [crossings, setCrossings] = useState<number | null>(null);
  const [minMoves, setMinMoves] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [revealName, setRevealName] = useState<string | null>(null);
  const [rushMs, setRushMs] = useState(mode === "rush" ? RUSH_START_MS : 0);
  const [rushScore, setRushScore] = useState(0);
  const callbacks = useRef({
    haptics,
    onCleared,
    onAdvance,
    race,
    onRushOver,
    mode,
    trail,
  });
  const mutedRef = useRef(muted);
  const themeRef = useRef(theme ?? getTheme("dusk"));
  const seedRef = useRef(seed);
  const soundRef = useRef(soundPack);
  const shapeRef = useRef(crystalShape);
  const invertedRef = useRef(inverted);
  const [hintVisible, setHintVisible] = useState(true);
  const [countdown, setCountdown] = useState<3 | 2 | 1 | null>(null);
  const [countAt, setCountAt] = useState<{ x: number; y: number } | null>(null);
  const [canvasError, setCanvasError] = useState(false);
  const [introOpen, setIntroOpen] = useState(constellationIntro);
  const introRef = useRef(constellationIntro);

  useEffect(() => {
    introRef.current = introOpen;
  }, [introOpen]);

  useEffect(() => {
    if (constellationIntro) setIntroOpen(true);
  }, [constellationIntro]);

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
    synth.setMuted(mutedRef.current);
    synth.setPack(soundRef.current);
    synthRef.current = synth;
    const renderer = new BoardRenderer();

    let graph: Graph | null = null;
    let width = 0;
    let height = 0;
    let levelNum = startLevel;
    let dragging: number | null = null;
    let pointerId: number | null = null;
    let celebrating = false;
    let celebrateStart = 0;
    let holdStart: number | null = null;
    let shownDigit: 3 | 2 | 1 | null = null;
    let spotKey = "";
    let introUntil = 0;
    let lastCross: number | null = null;
    let lastMoves: number | null = null;
    let last = performance.now();
    let time = 0;
    let raf = 0;
    let running = true;
    let moves = 0;
    let echoUntil = 0;
    let trailMotes: TrailMote[] = [];
    let rushLeft = callbacks.current.mode === "rush" ? RUSH_START_MS : 0;
    let rushCleared = 0;
    let rushEnded = false;
    let lastHudRush = -1;

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

    const publishCountdown = (digit: 3 | 2 | 1 | null) => {
      if (digit === shownDigit) return;
      shownDigit = digit;
      setCountdown(digit);
      if (digit === null) return;
      try {
        synth.countTick(digit);
      } catch {
        // Cisza nie zatrzymuje odliczania.
      }
    };

    const publishCountSpot = (graphNow: Graph) => {
      const rect = frame.getBoundingClientRect();
      const hud = hudRef.current?.getBoundingClientRect();
      const hudBottom = hud ? hud.bottom - rect.top : Math.min(120, rect.height * 0.16);
      const ringTop = graphNow.arena.cy - graphNow.arena.radius;
      const gapMid = hudBottom + Math.max(0, ringTop - hudBottom) / 2;
      const aboveRing = ringTop - 54;
      const y = Math.min(gapMid, aboveRing);
      const x = graphNow.arena.cx;
      const key = `${Math.round(x)}:${Math.round(y)}`;
      if (key === spotKey) return;
      spotKey = key;
      setCountAt({ x, y });
    };

    const digitFor = (elapsed: number): 3 | 2 | 1 => {
      if (elapsed < 1000) return 3;
      if (elapsed < 2000) return 2;
      return 1;
    };

    const readChrome = (): ArenaChrome | undefined => {
      // Obrót CSS psuje getBoundingClientRect względem layoutu — stałe pasy.
      if (embed || invertedRef.current || compact) {
        // Couch: maksymalnie duża arena w połowie ekranu.
        if (compact && hideChrome) return { top: 36, bottom: 8 };
        return { top: compact ? 52 : 64, bottom: hideChrome ? 12 : 56 };
      }
      const hud = hudRef.current;
      const menu = menuRef.current;
      const mute = muteRef.current;
      if (!hud || !menu || !mute) return undefined;
      const rect = frame.getBoundingClientRect();
      const hudBox = hud.getBoundingClientRect();
      const menuBox = menu.getBoundingClientRect();
      const muteBox = mute.getBoundingClientRect();
      if (hudBox.height < 8) return undefined;
      const top = hudBox.bottom - rect.top;
      const bottom = rect.bottom - Math.min(menuBox.top, muteBox.top);
      if (top < 8 || bottom < 8) return undefined;
      return { top, bottom };
    };

    const paint = (hits: ReturnType<typeof findIntersections>, bloom: number) => {
      if (!graph) return;
      const echoMode = callbacks.current.mode === "echo";
      const echoReveal = echoMode
        ? Math.max(0, Math.min(1, (echoUntil - performance.now()) / ECHO_REVEAL_MS))
        : undefined;
      renderer.draw(ctx, {
        graph,
        hits,
        time,
        bloom,
        width,
        height,
        theme: themeRef.current,
        crystalShape: shapeRef.current,
        echoReveal,
        trail: callbacks.current.trail ? trailMotes : undefined,
      });
    };

    const nodesSettled = (current: Graph) =>
      current.nodes.every((node) => Math.hypot(node.tx - node.x, node.ty - node.y) < 0.8);

    const mountLevel = (nextLevel: number, intro: boolean) => {
      levelNum = nextLevel;
      const chrome = readChrome();
      const lockedSeed = seedRef.current;
      const next =
        lockedSeed !== undefined
          ? createLevelWithSeed(nextLevel, lockedSeed, width, height, chrome)
          : createLevel(nextLevel, width, height, chrome);
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
      holdStart = null;
      moves = 0;
      echoUntil = 0;
      trailMotes = [];
      publishCountdown(null);
      const hits = findIntersections(graph.nodes, graph.edges);
      publishCrossings(hits.length);
      publishMoves(next.minimumMoves);
      setMoveCount(0);
      setLevel(nextLevel);
      setRevealName(null);
      callbacks.current.onAdvance(nextLevel);
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
      else fitGraph(graph, width, height, readChrome());

      if (graph) {
        publishCountSpot(graph);
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

        if (callbacks.current.trail && trailMotes.length > 0) {
          for (const mote of trailMotes) mote.life -= dt * 1.8;
          trailMotes = trailMotes.filter((mote) => mote.life > 0.02);
        }

        if (callbacks.current.mode === "rush" && !celebrating && !rushEnded) {
          rushLeft = Math.max(0, rushLeft - dt * 1000);
          const shown = Math.ceil(rushLeft / 1000);
          if (shown !== lastHudRush) {
            lastHudRush = shown;
            setRushMs(rushLeft);
          }
          if (rushLeft <= 0) {
            rushEnded = true;
            callbacks.current.onRushOver?.(rushCleared);
          }
        }

        if (graph) {
          stepNodes(graph.nodes, dt, celebrating ? null : dragging);
          let hits = findIntersections(graph.nodes, graph.edges);
          // Po rozplątaniu dociągnij do zarysu — inaczej 0 przecięć bez odliczania.
          if (
            graph.isConstellation &&
            graph.outline &&
            hits.length === 0 &&
            !celebrating &&
            dragging === null
          ) {
            settleNodesTowardOutline(graph.nodes, graph.outline, graph.arena.radius);
            hits = findIntersections(graph.nodes, graph.edges);
          }
          const introPlaying = now < introUntil;
          const shapeReady =
            !graph.isConstellation ||
            !graph.outline ||
            isConstellationMatched(graph.nodes, graph.outline, graph.arena.radius);
          const solved =
            hits.length === 0 && !isDegenerate(graph.nodes) && shapeReady;
          const masterFail =
            callbacks.current.mode === "master" &&
            !celebrating &&
            moves > graph.minimumMoves &&
            !solved;

          if (masterFail) {
            mountLevel(levelNum, true);
            return;
          }

          if (!celebrating && !rushEnded) {
            if (introPlaying || !solved) {
              holdStart = null;
              publishCountdown(null);
            } else {
              if (holdStart === null) holdStart = now;
              const elapsed = now - holdStart;
              const holdNeed = callbacks.current.mode === "rush" ? 900 : HOLD_MS;
              if (elapsed >= holdNeed && nodesSettled(graph)) {
                celebrating = true;
                celebrateStart = now;
                dragging = null;
                pointerId = null;
                holdStart = null;
                publishCountdown(null);
                setCleared(true);
                const name = graph.constellationName;
                if (name) setRevealName(name);
                const perfect = moves <= graph.minimumMoves;
                callbacks.current.onCleared({
                  level: levelNum,
                  moves,
                  minimumMoves: graph.minimumMoves,
                  perfect,
                  constellationName: name,
                  constellationId: graph.constellationId,
                });
                try {
                  if (name) synth.constellationChord();
                  else synth.victoryChord();
                } catch {
                  // Synteza jest ozdobą. Plansza działa też w ciszy.
                }
                if (callbacks.current.mode === "rush") {
                  rushCleared += 1;
                  rushLeft += RUSH_BONUS_MS;
                  setRushScore(rushCleared);
                  setRushMs(rushLeft);
                }
              } else if (callbacks.current.mode !== "rush") {
                publishCountSpot(graph);
                publishCountdown(digitFor(elapsed));
              }
            }
          }

          publishCrossings(hits.length);
          const victorySpan = graph.isConstellation ? CONSTELLATION_VICTORY_MS : VICTORY_MS;
          let bloom = 0;
          if (celebrating) bloom = Math.min(1, (now - celebrateStart) / victorySpan);
          else if (introUntil > now) bloom = Math.max(0, (introUntil - now) / INTRO_MS) * 0.45;
          paint(hits, bloom);

          if (
            celebrating &&
            callbacks.current.mode === "rush" &&
            now - celebrateStart >= 700 &&
            !rushEnded
          ) {
            mountLevel(Math.max(1, Math.min(12, 3 + Math.floor(rushCleared / 2))), true);
          } else if (
            celebrating &&
            now - celebrateStart >= victorySpan &&
            !callbacks.current.race &&
            callbacks.current.mode !== "rush"
          ) {
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
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;
      if (invertedRef.current) {
        x = rect.width - x;
        y = rect.height - y;
      }
      return { x, y };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.cancelable) event.preventDefault();
      synth.unlock();
      if (introRef.current) return;
      if (!graph || celebrating || pointerId !== null || rushEnded) return;

      const point = pointFrom(event);
      const id = pickNode(graph.nodes, point.x, point.y);
      if (id < 0) return;

      const node = graph.nodes[id];
      if (!node) return;

      pointerId = event.pointerId;
      dragging = id;
      node.pluck = 1;
      moves += 1;
      setMoveCount(moves);
      if (callbacks.current.mode === "echo") echoUntil = performance.now() + ECHO_REVEAL_MS;
      let target = placeDragTarget(graph.nodes, id, point.x, point.y, graph.arena);
      if (graph.outline) {
        target = magnetTowardOutline(
          target.x,
          target.y,
          graph.outline,
          graph.arena.radius,
          id,
        );
      }
      node.tx = target.x;
      node.ty = target.y;
      if (callbacks.current.haptics) navigator.vibrate?.(12);
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
      let target = placeDragTarget(graph.nodes, node.id, point.x, point.y, graph.arena);
      if (graph.outline) {
        target = magnetTowardOutline(
          target.x,
          target.y,
          graph.outline,
          graph.arena.radius,
          node.id,
        );
      }
      node.tx = target.x;
      node.ty = target.y;
      if (callbacks.current.trail && trailMotes.length < 48) {
        trailMotes.push({ x: target.x, y: target.y, life: 1 });
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      if (graph && dragging !== null && graph.outline) {
        const node = graph.nodes[dragging];
        if (node) {
          const target = snapToOutlineIfClose(
            node.tx,
            node.ty,
            graph.outline,
            graph.arena.radius,
            node.id,
          );
          node.tx = target.x;
          node.ty = target.y;
          if (
            callbacks.current.haptics &&
            Math.hypot(target.x - node.x, target.y - node.y) > 2
          ) {
            navigator.vibrate?.(8);
          }
        }
      }
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
    if (hudRef.current) observer.observe(hudRef.current);
    if (menuRef.current) observer.observe(menuRef.current);
    if (muteRef.current) observer.observe(muteRef.current);
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
  }, [startLevel]);

  useEffect(() => {
    callbacks.current = { haptics, onCleared, onAdvance, race, onRushOver, mode, trail };
    mutedRef.current = muted;
    themeRef.current = theme ?? getTheme("dusk");
    seedRef.current = seed;
    soundRef.current = soundPack;
    shapeRef.current = crystalShape;
    invertedRef.current = inverted;
    synthRef.current?.setMuted(muted);
    synthRef.current?.setPack(soundPack);
  }, [
    haptics,
    muted,
    onCleared,
    onAdvance,
    race,
    onRushOver,
    mode,
    trail,
    theme,
    seed,
    soundPack,
    crystalShape,
    inverted,
  ]);

  const calm = crossings === 0;
  const activeTheme = theme ?? getTheme("dusk");
  const levelLabel =
    level > CAMPAIGN_LEVELS ? `∞ ${level - CAMPAIGN_LEVELS}` : String(level);
  const rushUrgent = mode === "rush" && rushMs < 5000;
  const title =
    label ??
    (mode === "rush"
      ? t("mode_rush")
      : mode === "master"
        ? t("mode_master")
        : mode === "echo"
          ? t("mode_echo")
          : "Tangle Duel");

  const shellClass = embed
    ? "theme-chrome game-shell relative h-full w-full overflow-hidden"
    : "theme-chrome game-shell fixed inset-0 flex items-center justify-center overflow-hidden";
  const columnClass = embed
    ? "relative z-10 h-full w-full overflow-hidden"
    : "play-column z-10";

  return (
    <div
      className={shellClass}
      style={{ background: activeTheme.ink, ...themeChromeVars(activeTheme) }}
    >
      {!embed && (
        <div className="play-bleed">
          <ThemeBackdrop theme={activeTheme} />
        </div>
      )}
      <div
        ref={frameRef}
        className={columnClass}
        style={inverted ? { transform: "rotate(180deg)" } : undefined}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full touch-none"
          role="application"
          aria-label={t("board_aria")}
        />

        <div className="pointer-events-none absolute inset-0">
          {!hideChrome && (
            <button
              ref={menuRef}
              type="button"
              onClick={onMenu}
              aria-label={t("back_menu")}
              className="ui-chip pointer-events-auto absolute left-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] grid h-11 w-11 place-items-center rounded-full border bg-black/35 backdrop-blur-md"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
                <path d="M3 4.5h10M3 8h10M3 11.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {hideChrome && (
            <>
              <button
                ref={menuRef}
                type="button"
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none absolute left-2 bottom-2 h-8 w-8 opacity-0"
              />
              <button
                ref={muteRef}
                type="button"
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none absolute right-2 bottom-2 h-8 w-8 opacity-0"
              />
            </>
          )}
          <header
            ref={hudRef}
            className={
              compact && hideChrome
                ? "px-3 pt-1.5"
                : compact
                  ? "px-3 pt-2"
                  : "px-4 pt-[max(0.85rem,env(safe-area-inset-top))]"
            }
          >
            {compact && hideChrome ? (
              <div className="flex items-end justify-between gap-2">
                <p className="ui-kicker text-[10px] font-medium uppercase tracking-[0.28em]">
                  {title}
                </p>
                <p
                  className={`text-2xl font-light tabular-nums leading-none ${
                    calm ? "" : "ui-accent"
                  }`}
                >
                  {crossings === null ? "—" : crossings}
                </p>
              </div>
            ) : (
              <>
                <p className="ui-kicker text-center text-[10px] font-medium uppercase tracking-[0.42em]">
                  {title}
                </p>
                <div className={`mt-2 grid grid-cols-3 gap-2 ${compact ? "mt-1.5" : "mt-3"}`}>
                  {mode === "rush" ? (
                    <>
                      <HudStat
                        label={t("hud_time")}
                        value={`${Math.max(0, Math.ceil(rushMs / 1000))}s`}
                        tone={rushUrgent ? "amber" : "ice"}
                        compact={compact}
                      />
                      <HudStat label={t("hud_streak")} value={rushScore} align="center" compact={compact} />
                      <HudStat
                        label={t("hud_crossings")}
                        value={crossings === null ? "—" : crossings}
                        tone={calm ? "ice" : "amber"}
                        align="end"
                        compact={compact}
                      />
                    </>
                  ) : mode === "master" ? (
                    <>
                      <HudStat label={t("hud_moves")} value={moveCount} compact={compact} />
                      <HudStat
                        label={t("hud_pairs")}
                        value={minMoves === null ? "—" : minMoves}
                        tone={moveCount > (minMoves ?? 99) ? "amber" : "ice"}
                        align="center"
                        compact={compact}
                      />
                      <HudStat
                        label={t("hud_crossings")}
                        value={crossings === null ? "—" : crossings}
                        tone={calm ? "ice" : "amber"}
                        align="end"
                        compact={compact}
                      />
                    </>
                  ) : (
                    <>
                      <HudStat label={t("level_word")} value={levelLabel} compact={compact} />
                      <HudStat
                        label={t("hud_crossings")}
                        value={crossings === null ? "—" : crossings}
                        tone={calm ? "ice" : "amber"}
                        align="center"
                        compact={compact}
                      />
                      <HudStat
                        label={t("hud_min_moves")}
                        value={minMoves === null ? "—" : minMoves}
                        align="end"
                        compact={compact}
                      />
                    </>
                  )}
                </div>
              </>
            )}
          </header>

          {hintVisible &&
            !introOpen &&
            countdown === null &&
            !canvasError &&
            !compact &&
            mode === "echo" && (
            <p className="ui-muted hint-in absolute inset-x-8 bottom-[max(5.75rem,calc(env(safe-area-inset-bottom)+4.75rem))] text-center text-sm font-light leading-relaxed">
              {t("hint_echo")}
            </p>
          )}

          {hintVisible &&
            !introOpen &&
            countdown === null &&
            !canvasError &&
            !compact &&
            mode !== "echo" && (
            <p className="ui-muted hint-in absolute inset-x-8 bottom-[max(5.75rem,calc(env(safe-area-inset-bottom)+4.75rem))] text-center text-sm font-light leading-relaxed">
              {revealName || level % 5 === 0 ? t("hint_magnet") : t("hint_untangle")}
            </p>
          )}

          {introOpen && !compact && !hideChrome && (
            <div className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-black/45 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16 backdrop-blur-[2px]">
              <div className="ui-panel w-full max-w-sm rounded-[1.4rem] border px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.45)]">
                <p className="ui-kicker text-[11px] uppercase tracking-[0.28em]">
                  {t("constellation_intro_kicker")}
                </p>
                <h2 className="mt-2 text-[1.65rem] font-light tracking-[-0.03em]">
                  {t("constellation_intro_title")}
                </h2>
                <p className="ui-muted mt-3 text-[14px] font-light leading-relaxed">
                  {t("constellation_intro_body")}
                </p>
                <button
                  type="button"
                  className="play-seal mt-5 h-14 w-full rounded-[1.15rem] text-[15px] font-medium"
                  onClick={() => {
                    setIntroOpen(false);
                    onConstellationIntroSeen?.();
                  }}
                >
                  {t("constellation_intro_ok")}
                </button>
              </div>
            </div>
          )}

          {countdown !== null && !cleared && countAt && (
            <p
              key={countdown}
              role="status"
              aria-live="polite"
              aria-label={String(countdown)}
              className="count-arrive pointer-events-none absolute font-light leading-none tracking-[-0.04em]"
              style={{ left: countAt.x, top: countAt.y }}
            >
              {countdown}
            </p>
          )}

          {cleared && (
            <p
              role="status"
              className={`hint-in absolute inset-x-4 text-center font-light tracking-[0.16em] text-white ${
                compact ? "top-[14%] text-xl" : "top-[18%] text-2xl"
              }`}
            >
              {revealName ?? t("cleared_default")}
            </p>
          )}

          {canvasError && (
            <p className="absolute inset-x-8 top-1/2 -translate-y-1/2 text-center text-sm font-light text-[#fecaca]">
              {t("canvas_error")}
            </p>
          )}

          {!hideChrome && (
            <button
              ref={muteRef}
              type="button"
              aria-pressed={muted}
              aria-label={muted ? t("mute_on") : t("mute_off")}
              onClick={() => {
                const next = !muted;
                onMuted(next);
                synthRef.current?.unlock();
                synthRef.current?.setMuted(next);
              }}
              className="ui-chip pointer-events-auto absolute right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] grid h-11 w-11 place-items-center rounded-full border bg-black/35 backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ui-ice)]"
            >
              <SpeakerIcon muted={muted} />
            </button>
          )}
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
  compact = false,
}: {
  label: string;
  value: number | string;
  tone?: "ice" | "amber";
  align?: "start" | "center" | "end";
  compact?: boolean;
}) {
  const alignClass =
    align === "end" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <div className={alignClass}>
      <p className="ui-muted text-[9px] uppercase tracking-[0.18em]">{label}</p>
      <p
        className={`mt-0.5 font-light leading-none tabular-nums ${
          compact ? "text-xl" : "mt-1 text-3xl"
        } ${tone === "amber" ? "ui-accent" : ""}`}
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
