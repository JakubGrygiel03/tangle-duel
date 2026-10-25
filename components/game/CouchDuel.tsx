"use client";

import { useEffect, useState } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { ThemeBackdrop } from "@/components/game/ThemeBackdrop";
import type { SoundPackId } from "@/lib/engine/economy";
import type { VisualTheme } from "@/lib/engine/themes";

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
  trail?: boolean;
  onMuted: (muted: boolean) => void;
  onBack: () => void;
};

function rollMatch(): { level: number; seed: number } {
  return {
    level: 10 + Math.floor(Math.random() * 16),
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
  trail = false,
  onMuted,
  onBack,
}: CouchDuelProps) {
  const [match, setMatch] = useState(rollMatch);
  const [phase, setPhase] = useState<CouchPhase>({ kind: "ready" });
  const [flash, setFlash] = useState<"top" | "bottom" | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (phase.kind !== "countdown") return;
    const timer = window.setTimeout(() => {
      if (phase.seconds <= 1) setPhase({ kind: "race" });
      else setPhase({ kind: "countdown", seconds: phase.seconds - 1 });
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
    return (
      <div
        className="game-shell fixed inset-0 flex flex-col overflow-hidden text-[#e0f2fe]"
        style={{ background: theme.ink }}
      >
        <div className="play-bleed">
          <ThemeBackdrop theme={theme} />
        </div>
        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <div className="relative min-h-0 flex-1 border-b border-[#e0f2fe]/15">
            {flash === "top" && <Shockwave />}
            <GameBoard
              key={`top-${match.seed}`}
              level={match.level}
              seed={match.seed}
              race
              embed
              inverted
              hideChrome
              compact
              label="Gracz A"
              muted={muted}
              haptics={haptics}
              theme={theme}
              soundPack={soundPack}
              trail={trail}
              onMenu={onBack}
              onMuted={onMuted}
              onCleared={() => onWin("top")}
              onAdvance={() => undefined}
            />
          </div>
          <div className="relative z-20 flex h-10 shrink-0 items-center justify-center gap-4 border-y border-[#e0f2fe]/12 bg-black/50 backdrop-blur-md">
            <button
              type="button"
              onClick={onBack}
              className="px-3 text-[12px] uppercase tracking-[0.2em] text-[#e0f2fe]/70"
            >
              Wyjdź
            </button>
            <span className="text-[11px] uppercase tracking-[0.28em] text-[#e0f2fe]/45">
              Couch duel
            </span>
            <button
              type="button"
              onClick={() => onMuted(!muted)}
              className="px-3 text-[12px] uppercase tracking-[0.2em] text-[#e0f2fe]/70"
            >
              {muted ? "Dźwięk" : "Cisza"}
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            {flash === "bottom" && <Shockwave />}
            <GameBoard
              key={`bot-${match.seed}`}
              level={match.level}
              seed={match.seed}
              race
              embed
              hideChrome
              compact
              label="Gracz B"
              muted={muted}
              haptics={haptics}
              theme={theme}
              soundPack={soundPack}
              trail={trail}
              onMenu={onBack}
              onMuted={onMuted}
              onCleared={() => onWin("bottom")}
              onAdvance={() => undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="game-shell fixed inset-0 flex items-center justify-center text-[#e0f2fe]"
      style={{ background: theme.ink }}
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
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#e0f2fe]/20 bg-black/40 backdrop-blur-md"
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
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#e0f2fe]/45">Jeden telefon</p>
            <h1 className="text-[2rem] font-light leading-none tracking-[-0.03em]">Couch duel</h1>
          </div>
        </header>

        {phase.kind === "ready" && (
          <div className="mt-10 flex flex-1 flex-col">
            <p className="text-[15px] font-light leading-relaxed text-[#e0f2fe]/70">
              Połóż telefon na stole. Ty i rywal siedzicie naprzeciw — ten sam splątany układ,
              kto pierwszy utrzyma czyste struny, wygrywa.
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-auto mb-2 h-[4.6rem] w-full rounded-[1.35rem] bg-[linear-gradient(180deg,#f7fbff_0%,#d3e9f6_100%)] text-[1.25rem] font-medium text-[#0b1020]"
            >
              3 · 2 · 1 · Start
            </button>
          </div>
        )}

        {phase.kind === "countdown" && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#e0f2fe]/45">Gotowi</p>
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
            <p className="mt-3 text-[15px] font-light text-[#e0f2fe]/65">
              Fala wstrząsu poszła na drugą połowę ekranu.
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-auto mb-2 h-14 w-full rounded-[1.15rem] bg-[linear-gradient(180deg,#f7fbff_0%,#d3e9f6_100%)] text-base font-medium text-[#0b1020]"
            >
              Jeszcze raz
            </button>
            <button
              type="button"
              onClick={onBack}
              className="mb-1 h-12 w-full text-[14px] text-[#e0f2fe]/70"
            >
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
          "radial-gradient(circle at 50% 50%, rgba(249,115,22,0.45), transparent 62%)",
      }}
      aria-hidden
    />
  );
}
