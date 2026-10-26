"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  t: TranslateFn;
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
        text: t("duel_draw"),
        detail: t("duel_draw_detail"),
      });
      return;
    }
    const won =
      (message.winner === "host" && youHost) || (message.winner === "guest" && !youHost);
    setPhase({
      kind: "result",
      text: won ? t("duel_win") : t("duel_rival"),
      detail: won ? t("duel_win_detail") : t("duel_rival_detail"),
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
    setPhase({ kind: "host", code, status: t("duel_waiting") });
    try {
      sessionRef.current = await openDuelSession("host", code, {
        onOpen: () => setPhase({ kind: "host", code, status: t("duel_connected_host") }),
        onClose: (reason) => {
          setPhase({ kind: "result", text: t("duel_end"), detail: reason });
        },
        onMessage: handleWire,
      });
    } catch {
      setPhase({ kind: "result", text: t("duel_error"), detail: t("duel_error_open") });
    }
  };

  const startJoin = async () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length < 4) {
      setPhase({ kind: "result", text: t("duel_room_code"), detail: t("duel_code_needed") });
      return;
    }
    tearDown();
    roleRef.current = "guest";
    setPhase({ kind: "join", code, status: t("duel_connecting") });
    try {
      sessionRef.current = await openDuelSession("guest", code, {
        onOpen: () => setPhase({ kind: "join", code, status: t("duel_connected_guest") }),
        onClose: (reason) => {
          setPhase({ kind: "result", text: t("duel_end"), detail: reason });
        },
        onMessage: handleWire,
      });
    } catch {
      setPhase({ kind: "result", text: t("duel_error"), detail: t("duel_error_find") });
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
            aria-label={t("back_menu")}
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
            <p className="ui-muted text-[11px] uppercase tracking-[0.28em]">
              {onlineFlow ? t("duel_online_kicker") : t("duel_kicker")}
            </p>
            <h1 className="text-[2rem] font-light leading-none tracking-[-0.03em]">
              {onlineFlow ? t("duel_online") : t("duel")}
            </h1>
          </div>
        </header>

        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          {phase.kind === "pick" && (
            <>
              <div className="flex flex-col gap-3">
                <DuelOptionRow
                  title={t("duel_couch")}
                  detail={t("duel_couch_detail")}
                  tag={t("duel_couch_tag")}
                  onClick={() => setPhase({ kind: "couch" })}
                  icon={<CouchIcon />}
                />
                <DuelOptionRow
                  title={t("duel_online")}
                  detail={t("duel_online_detail")}
                  tag={t("duel_online_tag")}
                  onClick={() => setPhase({ kind: "online" })}
                  icon={<OnlineIcon />}
                />
              </div>
              <p className="ui-muted mt-auto pb-2 text-center text-[12px]">{t("duel_footer")}</p>
            </>
          )}

          {phase.kind === "online" && (
            <>
              <p className="ui-muted text-[14px] font-light leading-relaxed">
                {t("duel_online_intro")}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <DuelOptionRow
                  title={t("duel_create")}
                  detail={t("duel_room_code")}
                  tag={t("duel_online_tag")}
                  onClick={() => void startHost()}
                  icon={<HostIcon />}
                  accent
                />
                <div className="ui-panel rounded-[1.35rem] border px-3.5 py-3.5 backdrop-blur-md">
                  <p className="ui-accent text-[10px] uppercase tracking-[0.22em]">
                    {t("duel_code_friend")}
                  </p>
                  <input
                    value={joinInput}
                    onChange={(event) => setJoinInput(event.target.value.toUpperCase())}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="mt-3 h-14 w-full rounded-[1.05rem] border border-[color:var(--ui-line)] bg-black/35 px-4 text-center text-2xl font-light tracking-[0.35em] outline-none"
                    placeholder="•••••"
                    aria-label={t("duel_code_friend")}
                  />
                  <button
                    type="button"
                    onClick={() => void startJoin()}
                    className="ui-panel-soft mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[1.05rem] border text-[15px] font-medium active:scale-[0.985]"
                  >
                    <JoinIcon />
                    {t("duel_join")}
                  </button>
                </div>
              </div>
            </>
          )}

          {(phase.kind === "host" || phase.kind === "join") && (
            <div className="ui-panel mt-2 flex flex-1 flex-col items-center justify-center rounded-[1.45rem] border px-5 py-10 text-center backdrop-blur-md">
              <p className="ui-accent text-[10px] uppercase tracking-[0.28em]">{t("duel_room_code")}</p>
              <p className="mt-4 text-5xl font-light tracking-[0.28em]">{phase.code}</p>
              <div
                className="mt-8 h-1.5 w-16 overflow-hidden rounded-full"
                style={{ background: "var(--ui-warm-soft)" }}
                aria-hidden="true"
              >
                <div
                  className="h-full w-1/2 animate-pulse rounded-full"
                  style={{ background: "var(--ui-warm)" }}
                />
              </div>
              <p className="ui-muted mt-5 text-[15px] font-light">{phase.status}</p>
            </div>
          )}

          {phase.kind === "countdown" && (
            <div className="flex flex-1 flex-col items-center justify-center">
              <p className="ui-accent text-[11px] uppercase tracking-[0.28em]">{t("duel_start")}</p>
              <p className="mt-4 text-7xl font-light tabular-nums">{phase.seconds}</p>
            </div>
          )}

          {phase.kind === "result" && (
            <div className="mt-6 text-center">
              <div className="ui-panel rounded-[1.45rem] border px-5 py-10 backdrop-blur-md">
                <p className="text-4xl font-light tracking-[-0.03em]">{phase.text}</p>
                <p className="ui-muted mt-3 text-[15px] font-light">{phase.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  tearDown();
                  setPhase({ kind: "online" });
                  setJoinInput("");
                }}
                className="play-seal mt-6 h-14 w-full rounded-[1.15rem] text-base font-medium"
              >
                {t("duel_again")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DuelOptionRow({
  title,
  detail,
  tag,
  onClick,
  icon,
  accent = false,
}: {
  title: string;
  detail: string;
  tag: string;
  onClick: () => void;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[5.35rem] w-full items-center gap-3.5 rounded-[1.35rem] border px-3.5 py-3 text-left backdrop-blur-md active:scale-[0.985] ${
        accent ? "play-seal border-transparent" : "ui-panel"
      }`}
    >
      <span
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
        style={
          accent
            ? { background: "rgba(0,0,0,0.12)", color: "currentColor" }
            : { background: "var(--ui-warm-soft)", color: "var(--ui-warm)" }
        }
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[10px] uppercase tracking-[0.22em] ${
            accent ? "opacity-70" : "ui-accent"
          }`}
        >
          {tag}
        </span>
        <span className="mt-1 block text-[1.2rem] font-medium leading-none tracking-wide">{title}</span>
        <span className={`mt-1.5 block text-[12px] leading-snug ${accent ? "opacity-60" : "ui-muted"}`}>
          {detail}
        </span>
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        aria-hidden
        className={`shrink-0 ${accent ? "opacity-60" : "ui-muted opacity-70"}`}
      >
        <path
          d="M5 2.5 9.5 7 5 11.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function CouchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden fill="none">
      <rect x="5.2" y="8.2" width="17.6" height="12.2" rx="2.4" stroke="currentColor" strokeWidth="1.45" />
      <path d="M5.2 14h17.6" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="10.2" cy="11.2" r="1.35" fill="currentColor" />
      <circle cx="17.8" cy="17.4" r="1.35" fill="currentColor" />
    </svg>
  );
}

function OnlineIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden fill="none">
      <rect x="3.6" y="6.4" width="8.4" height="15.2" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <rect x="16" y="6.4" width="8.4" height="15.2" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12.2 11.2c1.1-.9 2.5-.9 3.6 0M12.2 16.8c1.1.9 2.5.9 3.6 0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <circle cx="7.8" cy="19.2" r="0.9" fill="currentColor" />
      <circle cx="20.2" cy="19.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

function HostIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden fill="none">
      <circle cx="14" cy="14" r="8.2" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3.2 2.4" />
      <path
        d="M14 8.4v5.2l3.4 2"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

function JoinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden fill="none">
      <path
        d="M7.2 4.2H4.8A1.6 1.6 0 0 0 3.2 5.8v6.4A1.6 1.6 0 0 0 4.8 13.8h2.4"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M10.2 9H14.6M12.4 6.8 14.8 9l-2.4 2.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
