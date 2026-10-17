"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import {
  readSave,
  readServerSave,
  subscribeSave,
  updateSave,
  type GameSave,
} from "@/components/game/storage";

type Screen = "tutorial" | "menu" | "levels" | "settings" | "play";

const STEPS = [
  {
    kicker: "Struny",
    title: "Przeciągnij kryształ",
    body: "Każdy kryształ trzyma końce świetlistych strun. Palec zostaje w okręgu — poza nim układ by się nie zmieścił.",
  },
  {
    kicker: "Przecięcia",
    title: "Bursztyn znaczy skrzyżowanie",
    body: "Bursztynowa struna i iskra to przecięcie. Lodowobiała struna jest wolna. Licznik u góry pokazuje, ile skrzyżowań zostało.",
  },
  {
    kicker: "Cel",
    title: "Rozplącz układ",
    body: "Przesuń jak najmniej kryształów, aż przecięć będzie zero. Liczba przy „Min. ruchy” to tyle przeciągnięć, ile naprawdę trzeba, żeby ten układ się rozwiązał.",
  },
];

export function GameApp() {
  const save = useSyncExternalStore(subscribeSave, readSave, readServerSave);
  const [screen, setScreen] = useState<Screen | "auto">("auto");
  const [step, setStep] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [run, setRun] = useState(0);
  const visible: Screen = screen === "auto" ? (save.tutorialSeen ? "menu" : "tutorial") : screen;

  const play = (level: number) => {
    updateSave((current) => ({ ...current, level }));
    setRun((value) => value + 1);
    setScreen("play");
  };

  const finishTutorial = () => {
    updateSave((current) => ({ ...current, tutorialSeen: true }));
    setStep(0);
    setScreen("menu");
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

  return (
    <div className="game-shell fixed inset-0 flex items-center justify-center bg-[#09090b] text-[#e0f2fe]">
      <div className="flex h-[100dvh] w-full max-w-[calc(100dvh*9/16)] flex-col px-6 pt-[max(1.75rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {visible === "tutorial" && (
          <Tutorial
            step={step}
            onNext={() => {
              if (step >= STEPS.length - 1) finishTutorial();
              else setStep((value) => value + 1);
            }}
            onSkip={finishTutorial}
          />
        )}
        {visible === "menu" && (
          <MainMenu
            level={save.level}
            onPlay={() => play(save.level)}
            onLevels={() => setScreen("levels")}
            onTutorial={() => {
              setStep(0);
              setScreen("tutorial");
            }}
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
            onToggleHaptics={() => updateSave((current) => ({ ...current, haptics: !current.haptics }))}
            onTutorial={() => {
              setStep(0);
              setScreen("tutorial");
            }}
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
      <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-[#e0f2fe]/45">
        Łamigłówka
      </p>
      <h1 className="mt-4 text-5xl font-light tracking-tight">Tangle Duel</h1>
      <p className="mt-4 max-w-[18rem] text-base font-light leading-relaxed text-[#e0f2fe]/70">
        Rozplątuj świetliste struny. Kryształy zostają w okręgu.
      </p>
      <div className="mt-auto flex flex-col gap-3">
        <MenuButton onClick={onPlay} primary>
          Graj · poziom {level}
        </MenuButton>
        <MenuButton onClick={onLevels}>Poziomy</MenuButton>
        <MenuButton onClick={onTutorial}>Jak grać</MenuButton>
        <MenuButton onClick={onSettings}>Ustawienia</MenuButton>
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
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Poziomy" onBack={onBack} />
      <p className="mt-3 text-sm font-light text-[#e0f2fe]/60">
        Piętnaście układów. Zaznaczone są już rozplątane.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 15 }, (_, index) => index + 1).map((level) => {
          const done = cleared.includes(level);
          const active = level === current;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onPick(level)}
              className={`flex h-16 flex-col items-center justify-center rounded-2xl border text-lg font-light tabular-nums ${
                active
                  ? "border-[#f97316]/70 bg-[#f97316]/15 text-[#fff7ed]"
                  : "border-[#e0f2fe]/15 bg-white/5 text-[#e0f2fe]"
              }`}
            >
              {level}
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#e0f2fe]/45">
                {done ? "Gotowe" : "Gra"}
              </span>
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
      <ScreenHeader title="Ustawienia" onBack={onBack} />
      <div className="mt-8 flex flex-col gap-3">
        <SettingRow
          label="Dźwięk"
          detail={save.muted ? "Wyłączony" : "Harfa włączona"}
          pressed={!save.muted}
          onClick={onToggleMuted}
        />
        <SettingRow
          label="Wibracje"
          detail={save.haptics ? "Przy chwyceniu kryształu" : "Wyłączone"}
          pressed={save.haptics}
          onClick={onToggleHaptics}
        />
        <SettingRow label="Samouczek" detail="Pokaż jeszcze raz" onClick={onTutorial} />
        <SettingRow
          label={confirmReset ? "Na pewno wyczyścić?" : "Resetuj postęp"}
          detail={confirmReset ? "Stuknij ponownie" : "Poziomy i odhaczenia"}
          danger
          onClick={onReset}
        />
      </div>
    </div>
  );
}

function Tutorial({
  step,
  onNext,
  onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const card = STEPS[step] ?? STEPS[0]!;
  const last = step >= STEPS.length - 1;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#e0f2fe]/45">
          {step + 1} / {STEPS.length}
        </p>
        <button type="button" onClick={onSkip} className="h-11 px-2 text-sm text-[#e0f2fe]/70">
          Pomiń
        </button>
      </div>
      <p className="mt-10 text-[10px] uppercase tracking-[0.32em] text-[#f97316]">{card.kicker}</p>
      <h1 className="mt-3 text-4xl font-light leading-tight">{card.title}</h1>
      <p className="mt-5 text-base font-light leading-relaxed text-[#e0f2fe]/75">{card.body}</p>
      <div className="mt-auto">
        <MenuButton onClick={onNext} primary>
          {last ? "Do menu" : "Dalej"}
        </MenuButton>
      </div>
    </div>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Wróć do menu"
        className="grid h-11 w-11 place-items-center rounded-full border border-[#e0f2fe]/20"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
          <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <h1 className="text-3xl font-light">{title}</h1>
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  primary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-14 rounded-full text-base font-light tracking-wide ${
        primary
          ? "bg-[#e0f2fe] text-[#09090b]"
          : "border border-[#e0f2fe]/20 bg-white/5 text-[#e0f2fe]"
      }`}
    >
      {children}
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
      className="flex h-[4.5rem] items-center justify-between rounded-2xl border border-[#e0f2fe]/15 bg-white/5 px-4 text-left"
    >
      <span>
        <span className={`block text-base font-light ${danger ? "text-[#fecaca]" : ""}`}>{label}</span>
        <span className="mt-1 block text-xs text-[#e0f2fe]/50">{detail}</span>
      </span>
      {pressed !== undefined && (
        <span
          className={`h-7 w-12 rounded-full p-1 ${pressed ? "bg-[#f97316]" : "bg-white/15"}`}
          aria-hidden="true"
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition-transform ${
              pressed ? "translate-x-5" : ""
            }`}
          />
        </span>
      )}
    </button>
  );
}
