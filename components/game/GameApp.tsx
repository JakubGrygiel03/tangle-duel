"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { LivingSky } from "@/components/game/LivingSky";
import {
  readSave,
  readServerSave,
  subscribeSave,
  updateSave,
  type GameSave,
} from "@/components/game/storage";
import { TutorialBoard } from "@/components/game/TutorialBoard";

type Screen = "tutorial" | "menu" | "levels" | "settings" | "play";

export function GameApp() {
  const save = useSyncExternalStore(subscribeSave, readSave, readServerSave);
  const [screen, setScreen] = useState<Screen | "auto">("auto");
  const [confirmReset, setConfirmReset] = useState(false);
  const [run, setRun] = useState(0);
  const visible: Screen = screen === "auto" ? (save.tutorialSeen ? "menu" : "tutorial") : screen;

  const play = (level: number) => {
    updateSave((current) => ({ ...current, level }));
    setRun((value) => value + 1);
    setScreen("play");
  };

  const openTutorial = () => setScreen("tutorial");

  const finishTutorial = () => {
    const firstVisit = !save.tutorialSeen;
    updateSave((current) => ({ ...current, tutorialSeen: true }));
    if (firstVisit) play(1);
    else setScreen("menu");
  };

  if (visible === "play") {
    return (
      <GameBoard
        key={run}
        level={save.level}
        muted={save.muted}
        haptics={save.haptics}
        onMenu={() => setScreen("menu")}
        onMuted={(muted) => updateSave((current) => ({ ...current, muted }))}
        onCleared={(level) =>
          updateSave((current) =>
            current.cleared.includes(level)
              ? current
              : { ...current, cleared: [...current.cleared, level] },
          )
        }
        onAdvance={(level) => updateSave((current) => ({ ...current, level }))}
      />
    );
  }

  if (visible === "tutorial") {
    return (
      <TutorialBoard
        muted={save.muted}
        haptics={save.haptics}
        firstVisit={!save.tutorialSeen}
        onSkip={() => {
          updateSave((current) => ({ ...current, tutorialSeen: true }));
          setScreen("menu");
        }}
        onFinish={finishTutorial}
      />
    );
  }

  return (
    <div className="game-shell fixed inset-0 flex items-center justify-center bg-[#09090b] text-[#e0f2fe]">
      <div className="relative h-[100dvh] w-full max-w-[calc(100dvh*9/16)] overflow-hidden">
        <LivingSky mood={visible === "menu" ? "menu" : "calm"} />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44 bg-gradient-to-b from-[#09090b] via-[#09090b]/75 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-64 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
        <div className="relative z-20 flex h-full flex-col px-5 pt-[max(1.15rem,env(safe-area-inset-top))] pb-[max(1.1rem,env(safe-area-inset-bottom))]">
          {visible === "menu" && (
            <MainMenu
              level={save.level}
              onPlay={() => play(save.level)}
              onLevels={() => setScreen("levels")}
              onTutorial={openTutorial}
              onSettings={() => {
                setConfirmReset(false);
                setScreen("settings");
              }}
            />
          )}
          {visible === "levels" && (
            <LevelSelect
              current={save.level}
              cleared={save.cleared}
              onBack={() => setScreen("menu")}
              onPick={play}
            />
          )}
          {visible === "settings" && (
            <SettingsScreen
              save={save}
              confirmReset={confirmReset}
              onBack={() => setScreen("menu")}
              onToggleMuted={() => updateSave((current) => ({ ...current, muted: !current.muted }))}
              onToggleHaptics={() =>
                updateSave((current) => ({ ...current, haptics: !current.haptics }))
              }
              onTutorial={openTutorial}
              onReset={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                updateSave((current) => ({ ...current, level: 1, cleared: [] }));
                setConfirmReset(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MainMenu({
  level,
  onPlay,
  onLevels,
  onTutorial,
  onSettings,
}: {
  level: number;
  onPlay: () => void;
  onLevels: () => void;
  onTutorial: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="pt-2 text-center">
        <h1 className="text-[3.35rem] font-light leading-[0.84] tracking-[-0.045em]">
          Tangle
          <br />
          Duel
        </h1>
        <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-[#e0f2fe]/70">
          <span className="h-px w-9 bg-current opacity-40" />
          <Diamond className="text-[#f97316]" />
          <span className="h-px w-9 bg-current opacity-40" />
        </div>
      </div>

      <div className="mt-auto">
        <button
          type="button"
          onClick={onPlay}
          className="play-seal flex h-[4.6rem] w-full items-center gap-3.5 rounded-[1.35rem] bg-[linear-gradient(180deg,#f7fbff_0%,#d3e9f6_100%)] px-3.5 text-left text-[#0b1020] active:scale-[0.985]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/10">
            <PlayCrystal />
          </span>
          <span className="min-w-0">
            <span className="block text-[1.45rem] font-medium leading-none tracking-wide">Graj</span>
            <span className="mt-1.5 block text-[13px] font-normal text-[#0b1020]/55">
              Poziom {level}
            </span>
          </span>
          <span className="ml-auto pr-2 text-[2rem] font-light tabular-nums leading-none">
            {level}
          </span>
        </button>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <DockTile label="Poziomy" onClick={onLevels}>
            <LevelsIcon />
          </DockTile>
          <DockTile label="Jak grać" onClick={onTutorial}>
            <LearnIcon />
          </DockTile>
          <DockTile label="Ustawienia" onClick={onSettings}>
            <SettingsIcon />
          </DockTile>
        </div>
      </div>
    </div>
  );
}

function LevelSelect({
  current,
  cleared,
  onBack,
  onPick,
}: {
  current: number;
  cleared: number[];
  onBack: () => void;
  onPick: (level: number) => void;
}) {
  const done = cleared.length;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader title="Poziomy" kicker={done === 0 ? "Wybierz układ" : `${done} gotowe`} onBack={onBack} />
      <div className="mt-6 grid min-h-0 flex-1 grid-cols-3 content-start gap-2.5 overflow-y-auto pb-2">
        {Array.from({ length: 15 }, (_, index) => index + 1).map((level) => {
          const clearedLevel = cleared.includes(level);
          const active = level === current;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onPick(level)}
              className={`flex h-[4.6rem] flex-col items-center justify-center rounded-[1.15rem] border backdrop-blur-md active:scale-[0.98] ${
                active
                  ? "border-[#f97316]/80 bg-[#f97316]/18 text-[#fff7ed] shadow-[0_0_24px_rgba(249,115,22,0.28)]"
                  : clearedLevel
                    ? "border-[#e0f2fe]/28 bg-[#e0f2fe]/10 text-[#e0f2fe]"
                    : "border-[#e0f2fe]/12 bg-black/35 text-[#e0f2fe]"
              }`}
            >
              {clearedLevel ? (
                <Diamond className="mb-0.5 text-[#e0f2fe]" />
              ) : (
                <span className="mb-0.5 h-2" />
              )}
              <span className="text-[1.65rem] font-light leading-none tabular-nums">{level}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SettingsScreen({
  save,
  confirmReset,
  onBack,
  onToggleMuted,
  onToggleHaptics,
  onTutorial,
  onReset,
}: {
  save: GameSave;
  confirmReset: boolean;
  onBack: () => void;
  onToggleMuted: () => void;
  onToggleHaptics: () => void;
  onTutorial: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Ustawienia" kicker="Dźwięk i postęp" onBack={onBack} />
      <div className="mt-6 flex flex-col gap-2.5">
        <SettingRow
          label="Dźwięk"
          detail={save.muted ? "Cisza" : "Harfa włączona"}
          pressed={!save.muted}
          onClick={onToggleMuted}
        />
        <SettingRow
          label="Wibracje"
          detail={save.haptics ? "Przy złapaniu kryształu" : "Wyłączone"}
          pressed={save.haptics}
          onClick={onToggleHaptics}
        />
        <SettingRow label="Nauka" detail="Pokaż jeszcze raz" onClick={onTutorial} />
        <SettingRow
          label={confirmReset ? "Na pewno wyczyścić?" : "Resetuj postęp"}
          detail={confirmReset ? "Stuknij jeszcze raz" : "Poziomy wracają na start"}
          danger
          onClick={onReset}
        />
      </div>
    </div>
  );
}

function ScreenHeader({
  title,
  kicker,
  onBack,
}: {
  title: string;
  kicker: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <button
        type="button"
        onClick={onBack}
        aria-label="Wróć do menu"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#e0f2fe]/20 bg-black/40 backdrop-blur-md"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
          <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#e0f2fe]/45">{kicker}</p>
        <h1 className="text-[2rem] font-light leading-none tracking-[-0.03em]">{title}</h1>
      </div>
    </div>
  );
}

function DockTile({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-[1.15rem] border border-[#e0f2fe]/16 bg-black/45 text-[#e0f2fe] backdrop-blur-md active:scale-[0.98]"
    >
      {children}
      <span className="text-[13px] font-normal leading-none">{label}</span>
    </button>
  );
}

function SettingRow({
  label,
  detail,
  onClick,
  pressed,
  danger = false,
}: {
  label: string;
  detail: string;
  onClick: () => void;
  pressed?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="flex h-[4.75rem] items-center justify-between rounded-[1.15rem] border border-[#e0f2fe]/14 bg-black/45 px-4 text-left backdrop-blur-md"
    >
      <span>
        <span className={`block text-[17px] font-normal ${danger ? "text-[#fecaca]" : ""}`}>{label}</span>
        <span className="mt-1 block text-[13px] text-[#e0f2fe]/50">{detail}</span>
      </span>
      {pressed !== undefined && (
        <span
          className={`h-8 w-[3.25rem] rounded-full p-1 ${pressed ? "bg-[#f97316]" : "bg-white/15"}`}
          aria-hidden="true"
        >
          <span
            className={`block h-6 w-6 rounded-full bg-white transition-transform ${
              pressed ? "translate-x-5" : ""
            }`}
          />
        </span>
      )}
    </button>
  );
}

function Diamond({ className }: { className?: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={className}>
      <path d="M5 0.6 9.2 5 5 9.4 0.8 5Z" fill="currentColor" />
    </svg>
  );
}

function PlayCrystal() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M13 1.8 23.2 13 13 24.2 2.8 13Z" fill="#0b1020" fillOpacity="0.12" stroke="#0b1020" strokeWidth="1.4" />
      <path d="M13 7.2 18.2 13 13 18.8 7.8 13Z" fill="#f97316" />
    </svg>
  );
}

function LevelsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <path d="M6 3.2 8.6 6.2 6 9.2 3.4 6.2Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M15.2 6.4 17.8 9.4 15.2 12.4 12.6 9.4Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.2 12.2 12.8 15.2 10.2 18.2 7.6 15.2Z" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function LearnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <path d="M6 14.5c2.2-4.8 6.2-6.6 10.2-6.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13.2 6.2 16.4 8.1 14.2 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.2" cy="14.6" r="1.5" fill="#f97316" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <path d="M3.5 7.5h15M3.5 14.5h15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="7.5" r="2.1" fill="#09090b" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="14" cy="14.5" r="2.1" fill="#09090b" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
