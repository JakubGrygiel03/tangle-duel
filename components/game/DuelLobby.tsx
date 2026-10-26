"use client";

import { useEffect, useRef, useState } from "react";
import { CouchDuel } from "@/components/game/CouchDuel";
import { GameBoard } from "@/components/game/GameBoard";
import { ThemeBackdrop } from "@/components/game/ThemeBackdrop";
import type { CrystalShapeId, SoundPackId } from "@/lib/engine/economy";
import {
  openDuelSession,
  randomRoomCode,
  type DuelSession,
  type DuelWire,
} from "@/lib/net/duel";
import { themeChromeVars, type VisualTheme } from "@/lib/engine/themes";
import type { TranslateFn } from "@/lib/i18n";

type Phase =
  | { kind: "pick" }
  | { kind: "online" }
  | { kind: "couch" }
  | { kind: "host"; code: string; status: string }
  | { kind: "join"; code: string; status: string }
  | { kind: "countdown"; seconds: number; level: number; seed: number }
  | { kind: "race"; level: number; seed: number }
  | { kind: "result"; text: string; detail: string };

type DuelLobbyProps = {
  muted: boolean;
  haptics: boolean;
  theme: VisualTheme;
  soundPack?: SoundPackId;
  crystalShape?: CrystalShapeId;
  trail?: boolean;
  t?: TranslateFn;
  onMuted: (muted: boolean) => void;
  onBack: () => void;
};

export function DuelLobby({
  muted,
  haptics,
  theme,
  soundPack = "harp",
  crystalShape = "diamond",
  trail = false,
  t,
  onMuted,
  onBack,
}: DuelLobbyProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "pick" });
  const [joinInput, setJoinInput] = useState("");
  const sessionRef = useRef<DuelSession | null>(null);
  const clearedRef = useRef<{ host?: number; guest?: number }>({});
  const roleRef = useRef<"host" | "guest">("host");
  const matchRef = useRef<{ level: number; seed: number } | null>(null);

  useEffect(() => {
    return () => {
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, []);

  const tearDown = () => {
    sessionRef.current?.destroy();
    sessionRef.current = null;
    clearedRef.current = {};
    matchRef.current = null;
  };

  const decideWinner = () => {
    const session = sessionRef.current;
    if (!session || session.role !== "host") return;
    const { host, guest } = clearedRef.current;
    if (host === undefined || guest === undefined) return;
    const delta = Math.abs(host - guest);
    const winner = delta < 100 ? "draw" : host < guest ? "host" : "guest";
    const message: DuelWire = {
      type: "result",
      winner,
      hostAt: host,
      guestAt: guest,
    };
    session.send(message);
    applyResult(message);
  };

  const applyResult = (message: Extract<DuelWire, { type: "result" }>) => {
    const youHost = roleRef.current === "host";
    if (message.winner === "draw") {
      setPhase({
        kind: "result",
        text: "Remis",
        detail: "Prawie równocześnie — pięknie.",
      });
      return;
    }
    const won =
      (message.winner === "host" && youHost) || (message.winner === "guest" && !youHost);
    // Zawsze celebrujemy zwycięzcę — bez słowa „przegrana”.
    setPhase({
      kind: "result",
      text: won ? "Wygrywasz" : "Wygrywa rywal",
      detail: won
        ? "Czyste struny pierwsze — brawo."
        : "Świetna runda. Następna może być Twoja.",
    });
  };

  const handleWire = (message: DuelWire) => {
    const session = sessionRef.current;
    if (!session) return;

    if (message.type === "hello" && session.role === "host") {
      const level = 12 + Math.floor(Math.random() * 20);
      const seed = (Math.random() * 0x7fffffff) | 0;
      matchRef.current = { level, seed };
      session.send({ type: "match", level, seed });
      const at = Date.now() + 3200;
      session.send({ type: "start", at });
      runCountdown(level, seed, at);
      return;
    }

    if (message.type === "match") {
      matchRef.current = { level: message.level, seed: message.seed };
      return;
    }

    if (message.type === "start") {
      const match = matchRef.current;
      if (!match) return;
      runCountdown(match.level, match.seed, message.at);
      return;
    }

    if (message.type === "cleared") {
      if (session.role === "host") {
        clearedRef.current.guest = message.at;
        decideWinner();
      }
      return;
    }

    if (message.type === "result") {
      applyResult(message);
    }
  };

  const runCountdown = (level: number, seed: number, at: number) => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((at - Date.now()) / 1000));
      if (left <= 0) {
        setPhase({ kind: "race", level, seed });
        return;
      }
      setPhase({ kind: "countdown", seconds: left, level, seed });
      window.setTimeout(tick, 120);
    };
    tick();
  };

  const startHost = async () => {
    tearDown();
    const code = randomRoomCode();
    roleRef.current = "host";
    setPhase({ kind: "host", code, status: "Czekam na rywala…" });
    try {
      sessionRef.current = await openDuelSession("host", code, {
        onOpen: () => setPhase({ kind: "host", code, status: "Połączono. Start zaraz…" }),
        onClose: (reason) => {
          setPhase({ kind: "result", text: "Koniec", detail: reason });
        },
        onMessage: handleWire,
      });
    } catch {
      setPhase({ kind: "result", text: "Błąd", detail: "Nie udało się otworzyć pokoju." });
    }
  };

  const startJoin = async () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length < 4) {
      setPhase({ kind: "result", text: "Kod", detail: "Wpisz kod od znajomego." });
      return;
    }
    tearDown();
    roleRef.current = "guest";
    setPhase({ kind: "join", code, status: "Łączę…" });
    try {
      sessionRef.current = await openDuelSession("guest", code, {
        onOpen: () => setPhase({ kind: "join", code, status: "Połączono. Czekam na start…" }),
        onClose: (reason) => {
          setPhase({ kind: "result", text: "Koniec", detail: reason });
        },
        onMessage: handleWire,
      });
    } catch {
      setPhase({ kind: "result", text: "Błąd", detail: "Nie znaleziono pokoju." });
    }
  };

  if (phase.kind === "couch") {
    return (
      <CouchDuel
        muted={muted}
        haptics={haptics}
        theme={theme}
        soundPack={soundPack}
        crystalShape={crystalShape}
        trail={trail}
        t={t}
        onMuted={onMuted}
        onBack={() => setPhase({ kind: "pick" })}
      />
    );
  }

  if (phase.kind === "race") {
    return (
      <GameBoard
        key={`${phase.level}-${phase.seed}`}
        level={phase.level}
        seed={phase.seed}
        race
        muted={muted}
        haptics={haptics}
        theme={theme}
        soundPack={soundPack}
        crystalShape={crystalShape}
        trail={trail}
        t={t}
        onMenu={() => {
          tearDown();
          onBack();
        }}
        onMuted={onMuted}
        onCleared={() => {
          const at = Date.now();
          const session = sessionRef.current;
          if (!session) return;
          if (session.role === "host") {
            clearedRef.current.host = at;
            decideWinner();
          } else {
            session.send({ type: "cleared", at });
          }
        }}
        onAdvance={() => undefined}
      />
    );
  }

  const onlineFlow =
    phase.kind === "online" ||
    phase.kind === "host" ||
    phase.kind === "join" ||
    phase.kind === "countdown" ||
    phase.kind === "result";

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
            onClick={() => {
              if (onlineFlow) {
                tearDown();
                setPhase({ kind: "pick" });
                setJoinInput("");
                return;
              }
              tearDown();
              onBack();
            }}
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
            <p className="ui-kicker text-[11px] uppercase tracking-[0.28em]">
              {onlineFlow ? "Dwa telefony" : "Rywalizacja"}
            </p>
            <h1 className="text-[2rem] font-light leading-none tracking-[-0.03em]">
              {onlineFlow ? "Online" : "Pojedynek"}
            </h1>
          </div>
        </header>

        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          {phase.kind === "pick" && (
            <>
              <p className="ui-muted text-[15px] font-light leading-relaxed">
                Ten sam układ. Kto pierwszy utrzyma czyste struny, wygrywa — na kanapie albo przez
                kod.
              </p>
              <button
                type="button"
                onClick={() => setPhase({ kind: "couch" })}
                className="play-seal mt-8 flex h-[4.6rem] w-full flex-col items-center justify-center rounded-[1.35rem]"
              >
                <span className="text-[1.25rem] font-medium">Jeden telefon</span>
                <span className="mt-1 text-[12px] font-normal opacity-55">
                  Split screen · naprzeciw siebie
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPhase({ kind: "online" })}
                className="ui-panel mt-3 flex h-[4.6rem] w-full flex-col items-center justify-center rounded-[1.35rem] border"
              >
                <span className="text-[1.15rem] font-medium">Dwa telefony</span>
                <span className="ui-muted mt-1 text-[12px]">Pokój na kod · online</span>
              </button>
            </>
          )}

          {phase.kind === "online" && (
            <>
              <p className="ui-muted text-[15px] font-light leading-relaxed">
                Stwórz pokój albo wpisz kod od znajomego. Bez konta — PeerJS łączy telefony.
              </p>
              <button
                type="button"
                onClick={() => void startHost()}
                className="play-seal mt-8 flex h-[4.6rem] w-full items-center justify-center rounded-[1.35rem] text-[1.25rem] font-medium"
              >
                Stwórz pokój
              </button>
              <div className="mt-5">
                <label className="ui-kicker block text-[11px] uppercase tracking-[0.28em]">
                  Kod znajomego
                </label>
                <input
                  value={joinInput}
                  onChange={(event) => setJoinInput(event.target.value.toUpperCase())}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className="ui-panel mt-2 h-14 w-full rounded-[1.15rem] border px-4 text-center text-2xl font-light tracking-[0.35em] outline-none"
                  placeholder="•••••"
                />
                <button
                  type="button"
                  onClick={() => void startJoin()}
                  className="ui-panel mt-3 h-14 w-full rounded-[1.15rem] border text-[15px]"
                >
                  Dołącz
                </button>
              </div>
            </>
          )}

          {(phase.kind === "host" || phase.kind === "join") && (
            <div className="mt-6 text-center">
              <p className="ui-kicker text-[11px] uppercase tracking-[0.28em]">Kod pokoju</p>
              <p className="mt-3 text-5xl font-light tracking-[0.28em]">{phase.code}</p>
              <p className="ui-muted mt-6 text-[15px] font-light">{phase.status}</p>
            </div>
          )}

          {phase.kind === "countdown" && (
            <div className="flex flex-1 flex-col items-center justify-center">
              <p className="ui-kicker text-[11px] uppercase tracking-[0.28em]">Start</p>
              <p className="mt-4 text-7xl font-light tabular-nums">{phase.seconds}</p>
            </div>
          )}

          {phase.kind === "result" && (
            <div className="mt-10 text-center">
              <p className="text-4xl font-light tracking-[-0.03em]">{phase.text}</p>
              <p className="ui-muted mt-3 text-[15px] font-light">{phase.detail}</p>
              <button
                type="button"
                onClick={() => {
                  tearDown();
                  setPhase({ kind: "online" });
                  setJoinInput("");
                }}
                className="play-seal mt-10 h-14 w-full rounded-[1.15rem] text-base font-medium"
              >
                Jeszcze raz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
