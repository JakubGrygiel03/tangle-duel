"use client";

import { useEffect, useState } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { ThemeBackdrop } from "@/components/game/ThemeBackdrop";
import type { CrystalShapeId, SoundPackId, TrailId } from "@/lib/engine/economy";
import { themeChromeVars, type VisualTheme } from "@/lib/engine/themes";
import type { TranslateFn } from "@/lib/i18n";

type CouchPhase =
  | { kind: "ready" }
  | { kind: "countdown"; seconds: number }
  | { kind: "race" }
  | { kind: "result"; winner: "top" | "bottom" | "draw" };

type CouchDuelProps = {
  muted: boolean;
  haptics: boolean;
  theme: VisualTheme;
  soundPack?: SoundPackId;
  crystalShape?: CrystalShapeId;
  trail?: TrailId | null;
  t?: TranslateFn;
  onMuted: (muted: boolean) => void;
  onBack: () => void;
};

function rollMatch(): { level: number; seed: number } {
  return {
    level: 8 + Math.floor(Math.random() * 12),
    seed: (Math.random() * 0x7fffffff) | 0,
  };
}

/**
 * Lokalny 1v1 na jednym ekranie — góra i dół, ten sam układ.
 * Górna połowa jest obrócona, żeby gracze siedzieli naprzeciw.
 */
export function CouchDuel({
  muted,
  haptics,
  theme,
  soundPack = "harp",
  crystalShape = "diamond",
  trail = null,
  t,
  onMuted,
  onBack,
}: CouchDuelProps) {
  const [match, setMatch] = useState(rollMatch);
  const [phase, setPhase] = useState<CouchPhase>({ kind: "ready" });
  const [flash, setFlash] = useState<"top" | "bottom" | null>(null);
  const [locked, setLocked] = useState(false);
  const [boardKey, setBoardKey] = useState(0);

  useEffect(() => {
    if (phase.kind !== "countdown") return;
    const timer = window.setTimeout(() => {
      if (phase.seconds <= 1) {
        setBoardKey((value) => value + 1);
        setPhase({ kind: "race" });
      } else setPhase({ kind: "countdown", seconds: phase.seconds - 1 });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 900);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const start = () => {
    setLocked(false);
    setFlash(null);
    setMatch(rollMatch());
    setPhase({ kind: "countdown", seconds: 3 });
  };

  const onWin = (who: "top" | "bottom") => {
    if (locked || phase.kind !== "race") return;
    setLocked(true);
    setFlash(who === "top" ? "bottom" : "top");
    window.setTimeout(() => {
      setPhase({ kind: "result", winner: who });
    }, 650);
  };

  if (phase.kind === "race") {
    const shared = {
      level: match.level,
      seed: match.seed,
      race: true as const,
      embed: true,
      hideChrome: true,
      compact: true,
      muted,
      haptics,
      theme,
      soundPack,
      crystalShape,
      trail,
      t,
      onMenu: onBack,
      onMuted,
      onAdvance: () => undefined,
    };

    return (
      <div
        className="theme-chrome game-shell fixed inset-0 overflow-hidden"
        style={{ background: theme.ink, ...themeChromeVars(theme) }}
      >
        <div className="play-bleed">
          <ThemeBackdrop theme={theme} />
        </div>

        {/* Równe połowy + wąski pasek na środku — absolute, żeby flex nie zgniatał areny. */}
        <div className="absolute inset-0 z-10">
          <div className="absolute inset-x-0 top-0 bottom-[calc(50%+1.125rem)] overflow-hidden">
            {flash === "top" && <Shockwave />}
            <GameBoard
              key={`top-${match.seed}-${boardKey}`}
              {...shared}
              inverted
              label="Gracz A"
              onCleared={() => onWin("top")}
            />
          </div>

          <div
            className="absolute inset-x-0 top-1/2 z-30 flex h-9 -translate-y-1/2 items-center justify-between gap-2 border-y bg-black/60 px-3 backdrop-blur-md"
            style={{ borderColor: "var(--ui-ice-soft)" }}
          >
            <button
              type="button"
              onClick={onBack}
              className="ui-muted min-h-9 px-2 text-[11px] uppercase tracking-[0.18em]"
            >
              Wyjdź
            </button>
            <span className="ui-kicker text-[10px] uppercase tracking-[0.28em]">Couch duel</span>
            <button
              type="button"
              onClick={() => onMuted(!muted)}
              className="ui-muted min-h-9 px-2 text-[11px] uppercase tracking-[0.18em]"
            >
              {muted ? "Dźwięk" : "Cisza"}
            </button>
          </div>

          <div className="absolute inset-x-0 top-[calc(50%+1.125rem)] bottom-0 overflow-hidden">
            {flash === "bottom" && <Shockwave />}
            <GameBoard
              key={`bot-${match.seed}-${boardKey}`}
              {...shared}
              label="Gracz B"
              onCleared={() => onWin("bottom")}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="theme-chrome game-shell fixed inset-0 flex items-center justify-center"
      style={{ background: theme.ink, ...themeChromeVars(theme) }}
    >
      <div className="play-bleed">
        <ThemeBackdrop theme={theme} />
      </div>
      <div className="play-column z-10 flex flex-col px-5 pt-[max(1.15rem,env(safe-area-inset-top))] pb-[max(1.1rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Wróć"
            className="ui-chip grid h-12 w-12 shrink-0 place-items-center rounded-full border bg-black/40 backdrop-blur-md"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
              <path
                d="M10 3 5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div>
            <p className="ui-kicker text-[11px] uppercase tracking-[0.28em]">Jeden telefon</p>
            <h1 className="text-[2rem] font-light leading-none tracking-[-0.03em]">Couch duel</h1>
          </div>
        </header>

        {phase.kind === "ready" && (
          <div className="mt-10 flex flex-1 flex-col">
            <p className="ui-muted text-[15px] font-light leading-relaxed">
              Połóż telefon na stole. Ty i rywal siedzicie naprzeciw — ten sam splątany układ,
              kto pierwszy utrzyma czyste struny, wygrywa.
            </p>
            <button
              type="button"
              onClick={start}
              className="play-seal mt-auto mb-2 h-[4.6rem] w-full rounded-[1.35rem] text-[1.25rem] font-medium"
            >
              3 · 2 · 1 · Start
            </button>
          </div>
        )}

        {phase.kind === "countdown" && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <p className="ui-kicker text-[11px] uppercase tracking-[0.28em]">Gotowi</p>
            <p className="mt-4 text-7xl font-light tabular-nums">{phase.seconds}</p>
          </div>
        )}

        {phase.kind === "result" && (
          <div className="mt-12 flex flex-1 flex-col text-center">
            <p className="text-4xl font-light tracking-[-0.03em]">
              {phase.winner === "draw"
                ? "Remis"
                : phase.winner === "top"
                  ? "Wygrywa góra"
                  : "Wygrywa dół"}
            </p>
            <p className="ui-muted mt-3 text-[15px] font-light">
              {phase.winner === "draw"
                ? "Prawie równocześnie — pięknie."
                : "Świetna runda. Gotowi na kolejną?"}
            </p>
            <button
              type="button"
              onClick={start}
              className="play-seal mt-auto mb-2 h-14 w-full rounded-[1.15rem] text-base font-medium"
            >
              Jeszcze raz
            </button>
            <button type="button" onClick={onBack} className="ui-muted mb-1 h-12 w-full text-[14px]">
              Wróć do menu pojedynku
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Shockwave() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 animate-pulse"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--ui-warm, #f97316) 45%, transparent), transparent 62%)",
      }}
      aria-hidden
    />
  );
}
