"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { DuelLobby } from "@/components/game/DuelLobby";
import { GameBoard } from "@/components/game/GameBoard";
import { LivingSky } from "@/components/game/LivingSky";
import { StudioCard } from "@/components/game/StudioCard";
import { ThemeBackdrop } from "@/components/game/ThemeBackdrop";
import {
  readSave,
  readServerSave,
  recordClearedLevel,
  subscribeSave,
  updateSave,
  type GameSave,
} from "@/components/game/storage";
import { TutorialBoard } from "@/components/game/TutorialBoard";
import { getDailyChallenge } from "@/lib/engine/daily";
import {
  AD_COOLDOWN_MS,
  AD_CRYSTAL_REWARD,
  crystalsForLevel,
  themeCrystalPrice,
} from "@/lib/engine/economy";
import { CAMPAIGN_LEVELS, isEndlessUnlocked, type ArenaChrome } from "@/lib/engine/graph";
import {
  getTheme,
  isThemeUnlocked,
  THEMES,
  themeUnlockRequirement,
  themesUnlockedByClear,
  type ThemeId,
  type VisualTheme,
} from "@/lib/engine/themes";

type Screen = "tutorial" | "menu" | "levels" | "shop" | "settings" | "play" | "duel" | "event";
type PlayMode = "campaign" | "daily";

const STUDIO_HOLD_MS = 2400;
const STUDIO_FADE_MS = 1300;

export function GameApp() {
  const save = useSyncExternalStore(subscribeSave, readSave, readServerSave);
  const theme = getTheme(save.themeId);
  const daily = getDailyChallenge();
  const [screen, setScreen] = useState<Screen | "auto">("auto");
  const [studio, setStudio] = useState<"show" | "leave" | "done">("show");
  const [confirmReset, setConfirmReset] = useState(false);
  const [run, setRun] = useState(0);
  const [playMode, setPlayMode] = useState<PlayMode>("campaign");
  const [dailySeed, setDailySeed] = useState<number | undefined>(undefined);
  const [unlockNote, setUnlockNote] = useState<string | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [menuBand, setMenuBand] = useState<ArenaChrome | undefined>(undefined);
  const visible: Screen = screen === "auto" ? (save.tutorialSeen ? "menu" : "tutorial") : screen;
  const dailyDone = save.dailyClaimedOn === daily.day;

  const play = (level: number) => {
    setPlayMode("campaign");
    setDailySeed(undefined);
    updateSave((current) => ({ ...current, level }));
    setRun((value) => value + 1);
    setScreen("play");
  };

  const playDaily = () => {
    const challenge = getDailyChallenge();
    setPlayMode("daily");
    setDailySeed(challenge.seed);
    updateSave((current) => ({ ...current, level: challenge.level }));
    setRun((value) => value + 1);
    setScreen("play");
  };

  const openTutorial = () => setScreen("tutorial");

  useEffect(() => {
    if (studio !== "show") return;
    const timer = window.setTimeout(() => setStudio("leave"), STUDIO_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [studio]);

  useEffect(() => {
    if (studio !== "leave") return;
    const timer = window.setTimeout(() => setStudio("done"), STUDIO_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [studio]);

  useEffect(() => {
    if (!unlockNote) return;
    const timer = window.setTimeout(() => setUnlockNote(null), 3200);
    return () => window.clearTimeout(timer);
  }, [unlockNote]);

  const skipStudio = () => setStudio((current) => (current === "show" ? "leave" : current));

  useLayoutEffect(() => {
    if (studio === "show" || visible !== "menu") return;
    const shell = shellRef.current;
    if (!shell) return;

    const measure = () => {
      const mark = shell.querySelector("[data-menu-mark]");
      const playBtn = shell.querySelector("[data-menu-play]");
      if (!(mark instanceof HTMLElement) || !(playBtn instanceof HTMLElement)) return;
      const rect = shell.getBoundingClientRect();
      const top = mark.getBoundingClientRect().bottom - rect.top;
      const bottom = rect.bottom - playBtn.getBoundingClientRect().top;
      setMenuBand((current) => {
        if (current && Math.abs(current.top - top) < 0.5 && Math.abs(current.bottom - bottom) < 0.5) {
          return current;
        }
        return { top, bottom };
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    const mark = shell.querySelector("[data-menu-mark]");
    const playBtn = shell.querySelector("[data-menu-play]");
    if (mark) observer.observe(mark);
    if (playBtn) observer.observe(playBtn);
    return () => observer.disconnect();
  }, [visible, studio]);

  const finishTutorial = () => {
    updateSave((current) => ({ ...current, tutorialSeen: true }));
    setScreen("menu");
  };

  const onCleared = (level: number) => {
    let note: string | null = null;
    if (playMode === "daily") {
      const challenge = getDailyChallenge();
      updateSave((current) => {
        if (current.dailyClaimedOn === challenge.day) {
          note = "Daily już zaliczone dziś";
          return current;
        }
        note = `Daily! +${challenge.reward} kryształów`;
        return {
          ...current,
          dailyClaimedOn: challenge.day,
          crystals: current.crystals + challenge.reward,
        };
      });
      if (note) setUnlockNote(note);
      return;
    }

    updateSave((current) => {
      const already =
        (level <= CAMPAIGN_LEVELS && current.clearedCampaign.includes(level)) ||
        (level > CAMPAIGN_LEVELS && level <= current.endlessBest);
      const unlocked = themesUnlockedByClear(
        level,
        current.clearedCampaign,
        current.endlessBest,
        current.purchasedThemes,
      );
      const next = recordClearedLevel(current, level);
      if (unlocked[0]) note = `Odblokowano: ${unlocked[0]!.name}`;
      else if (!already) note = `+${crystalsForLevel(level)} kryształów`;
      return next;
    });
    if (note) setUnlockNote(note);
  };

  let stage: ReactNode;
  if (visible === "play") {
    stage = (
      <GameBoard
        key={run}
        level={save.level}
        muted={save.muted}
        haptics={save.haptics}
        theme={theme}
        seed={playMode === "daily" ? dailySeed : undefined}
        race={playMode === "daily"}
        onMenu={() => setScreen("menu")}
        onMuted={(muted) => updateSave((current) => ({ ...current, muted }))}
        onCleared={onCleared}
        onAdvance={(level) => {
          if (playMode === "daily") return;
          updateSave((current) => ({ ...current, level }));
        }}
      />
    );
  } else if (visible === "duel") {
    stage = (
      <DuelLobby
        muted={save.muted}
        haptics={save.haptics}
        theme={theme}
        onMuted={(muted) => updateSave((current) => ({ ...current, muted }))}
        onBack={() => setScreen("menu")}
      />
    );
  } else if (visible === "tutorial") {
    stage = (
      <TutorialBoard
        muted={save.muted}
        haptics={save.haptics}
        theme={theme}
        firstVisit={!save.tutorialSeen}
        onSkip={() => {
          updateSave((current) => ({ ...current, tutorialSeen: true }));
          setScreen("menu");
        }}
        onFinish={finishTutorial}
      />
    );
  } else {
    stage = (
      <div
        className="game-shell fixed inset-0 flex items-center justify-center text-[#e0f2fe]"
        style={{ background: theme.ink }}
      >
        <div className="play-bleed">
          <ThemeBackdrop theme={theme} />
        </div>
        <div ref={shellRef} className="play-column z-10">
          <LivingSky
            mood={visible === "menu" ? "menu" : "calm"}
            band={visible === "menu" ? menuBand : undefined}
            theme={theme}
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36"
            style={{
              background: `linear-gradient(to bottom, ${theme.ink}, ${theme.ink}99, transparent)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40"
            style={{
              background: `linear-gradient(to top, ${theme.ink}, ${theme.ink}99, transparent)`,
            }}
          />
          <div className="relative z-20 flex h-full flex-col px-5 pt-[max(1.15rem,env(safe-area-inset-top))] pb-[max(1.1rem,env(safe-area-inset-bottom))]">
            {visible === "menu" && (
              <MainMenu
                level={save.level}
                muted={save.muted}
                crystals={save.crystals}
                theme={theme}
                dailyDone={dailyDone}
                dailyReward={daily.reward}
                onPlay={() => play(save.level)}
                onDaily={playDaily}
                onDuel={() => setScreen("duel")}
                onEvent={() => setScreen("event")}
                onLevels={() => setScreen("levels")}
                onShop={() => setScreen("shop")}
                onTutorial={openTutorial}
                onToggleMuted={() => updateSave((current) => ({ ...current, muted: !current.muted }))}
                onSettings={() => {
                  setConfirmReset(false);
                  setScreen("settings");
                }}
              />
            )}
            {visible === "event" && (
              <EventScreen theme={theme} onBack={() => setScreen("menu")} onShop={() => setScreen("shop")} />
            )}
            {visible === "levels" && (
              <LevelSelect
                current={save.level}
                cleared={save.clearedCampaign}
                endlessBest={save.endlessBest}
                endlessOpen={isEndlessUnlocked(save.clearedCampaign)}
                onBack={() => setScreen("menu")}
                onPick={play}
                onEndless={() => play(Math.max(CAMPAIGN_LEVELS + 1, save.endlessBest || CAMPAIGN_LEVELS + 1))}
              />
            )}
            {visible === "shop" && (
              <ShopScreen
                save={save}
                onBack={() => setScreen("menu")}
                onNote={setUnlockNote}
                onPickTheme={(themeId) => updateSave((current) => ({ ...current, themeId }))}
                onBuyTheme={(themeId, price) => {
                  updateSave((current) => {
                    if (current.crystals < price) return current;
                    if (current.purchasedThemes.includes(themeId)) return current;
                    return {
                      ...current,
                      crystals: current.crystals - price,
                      purchasedThemes: [...current.purchasedThemes, themeId],
                      themeId,
                    };
                  });
                  setUnlockNote("Motyw odblokowany");
                }}
                onWatchAd={() => {
                  const now = Date.now();
                  let ok = false;
                  updateSave((current) => {
                    if (now - current.lastAdAt < AD_COOLDOWN_MS) return current;
                    ok = true;
                    return {
                      ...current,
                      crystals: current.crystals + AD_CRYSTAL_REWARD,
                      lastAdAt: now,
                    };
                  });
                  setUnlockNote(
                    ok
                      ? `+${AD_CRYSTAL_REWARD} kryształów (tu będzie reklama)`
                      : "Poczekaj chwilę na kolejną nagrodę",
                  );
                }}
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
                onDuel={() => setScreen("duel")}
                onTutorial={openTutorial}
                onReset={() => {
                  if (!confirmReset) {
                    setConfirmReset(true);
                    return;
                  }
                  updateSave((current) => ({
                    ...current,
                    level: 1,
                    clearedCampaign: [],
                    endlessBest: 0,
                    themeId: "dusk",
                    crystals: 0,
                    purchasedThemes: [],
                    lastAdAt: 0,
                    dailyClaimedOn: "",
                  }));
                  setConfirmReset(false);
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {studio !== "show" && stage}
      {studio !== "done" && <StudioCard leaving={studio === "leave"} onSkip={skipStudio} />}
      {unlockNote && (
        <p
          role="status"
          className="hint-in pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 mx-auto w-fit rounded-full border border-[#e0f2fe]/20 bg-black/70 px-5 py-2.5 text-sm text-[#e0f2fe] backdrop-blur-md"
        >
          {unlockNote}
        </p>
      )}
    </>
  );
}

function MainMenu({
  level,
  muted,
  crystals,
  theme,
  dailyDone,
  dailyReward,
  onPlay,
  onDaily,
  onDuel,
  onEvent,
  onLevels,
  onShop,
  onTutorial,
  onToggleMuted,
  onSettings,
}: {
  level: number;
  muted: boolean;
  crystals: number;
  theme: VisualTheme;
  dailyDone: boolean;
  dailyReward: number;
  onPlay: () => void;
  onDaily: () => void;
  onDuel: () => void;
  onEvent: () => void;
  onLevels: () => void;
  onShop: () => void;
  onTutorial: () => void;
  onToggleMuted: () => void;
  onSettings: () => void;
}) {
  const label = level > CAMPAIGN_LEVELS ? `Nieskończone ${level - CAMPAIGN_LEVELS}` : `Poziom ${level}`;
  return (
    <div className="flex h-full flex-col">
      <div className="relative pt-1">
        <button
          type="button"
          onClick={onToggleMuted}
          aria-pressed={muted}
          aria-label={muted ? "Włącz dźwięk" : "Wycisz dźwięk"}
          className="absolute left-0 top-0 z-30 grid h-11 w-11 place-items-center rounded-full border border-[#e0f2fe]/20 bg-black/40 text-[#e0f2fe] backdrop-blur-md"
        >
          <SpeakerIcon muted={muted} />
        </button>
        <button
          type="button"
          onClick={onSettings}
          aria-label="Ustawienia"
          className="absolute right-0 top-0 z-30 grid h-11 w-11 place-items-center rounded-full border border-[#e0f2fe]/20 bg-black/40 text-[#e0f2fe] backdrop-blur-md"
        >
          <GearIcon />
        </button>
        <div data-menu-mark className="px-12 text-center">
          <h1 className="text-[3.2rem] font-light leading-[0.84] tracking-[-0.045em]">
            Tangle
            <br />
            Duel
          </h1>
          <div className="mx-auto mt-3.5 flex items-center justify-center gap-3 text-[#e0f2fe]/70">
            <span className="h-px w-9 bg-current opacity-40" />
            <Diamond style={{ color: theme.warm }} />
            <span className="h-px w-9 bg-current opacity-40" />
          </div>
          <p className="mt-2.5 text-[12px] tabular-nums tracking-wide text-[#e0f2fe]/45">
            {crystals} kryształów
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <button
          type="button"
          data-menu-play
          onClick={onPlay}
          className="play-seal flex h-[4.5rem] w-full items-center gap-3.5 rounded-[1.35rem] bg-[linear-gradient(180deg,#f7fbff_0%,#d3e9f6_100%)] px-3.5 text-left text-[#0b1020] active:scale-[0.985]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/10">
            <PlayCrystal accent={theme.warm} />
          </span>
          <span className="min-w-0">
            <span className="block text-[1.4rem] font-medium leading-none tracking-wide">Graj</span>
            <span className="mt-1.5 block text-[13px] font-normal text-[#0b1020]/55">{label}</span>
          </span>
          <span className="ml-auto pr-2 text-[2rem] font-light tabular-nums leading-none">
            {level > CAMPAIGN_LEVELS ? "∞" : level}
          </span>
        </button>

        <button
          type="button"
          onClick={onDaily}
          className={`mt-2.5 flex h-[4.35rem] w-full items-center gap-3.5 rounded-[1.25rem] border px-3.5 text-left backdrop-blur-md active:scale-[0.985] ${
            dailyDone
              ? "border-[#e0f2fe]/14 bg-black/35 text-[#e0f2fe]"
              : "border-[#f97316]/45 bg-[#f97316]/14 text-[#fff7ed] shadow-[0_0_28px_rgba(249,115,22,0.18)]"
          }`}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black/25">
            <DailyIcon accent={dailyDone ? "#e0f2fe" : "#f97316"} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[1.15rem] font-medium leading-none">Daily</span>
            <span className={`mt-1.5 block text-[12px] ${dailyDone ? "text-[#e0f2fe]/50" : "text-[#ffedd5]/75"}`}>
              {dailyDone ? "Zaliczone dziś" : `Układ dnia · +${dailyReward}`}
            </span>
          </span>
        </button>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <FeatureTile label="Pojedynek" detail="1v1 na kod" onClick={onDuel}>
            <DuelIcon />
          </FeatureTile>
          <FeatureTile label="Event" detail="Sezonowy" onClick={onEvent}>
            <EventIcon />
          </FeatureTile>
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          <DockTile label="Poziomy" onClick={onLevels}>
            <LevelsIcon />
          </DockTile>
          <DockTile label="Sklep" onClick={onShop}>
            <ShopIcon />
          </DockTile>
          <DockTile label="Jak grać" onClick={onTutorial}>
            <LearnIcon />
          </DockTile>
        </div>
      </div>
    </div>
  );
}

function EventScreen({
  theme,
  onBack,
  onShop,
}: {
  theme: VisualTheme;
  onBack: () => void;
  onShop: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader title="Event" kicker="Sezonowy układ" onBack={onBack} />
      <div className="mt-8 flex flex-1 flex-col">
        <div className="rounded-[1.35rem] border border-[#e0f2fe]/16 bg-black/45 px-5 py-6 backdrop-blur-md">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f97316]/15">
            <EventIcon large />
          </div>
          <h2 className="mt-5 text-center text-[1.65rem] font-light tracking-[-0.03em]">Mgławica weekendu</h2>
          <p className="mt-3 text-center text-[14px] font-light leading-relaxed text-[#e0f2fe]/60">
            Specjalny tor poziomów i nagrody motywowe wrócą wkrótce. Zbieraj kryształy w sklepie, żeby być gotowym.
          </p>
        </div>
        <button
          type="button"
          onClick={onShop}
          className="mt-4 h-14 w-full rounded-[1.15rem] border border-[#e0f2fe]/16 bg-black/45 text-[15px] backdrop-blur-md"
        >
          Idź do sklepu
        </button>
        <p className="mt-auto pb-2 text-center text-[12px] text-[#e0f2fe]/40" style={{ color: `${theme.ice}66` }}>
          Eventy rotują co tydzień
        </p>
      </div>
    </div>
  );
}

function LevelSelect({
  current,
  cleared,
  endlessBest,
  endlessOpen,
  onBack,
  onPick,
  onEndless,
}: {
  current: number;
  cleared: number[];
  endlessBest: number;
  endlessOpen: boolean;
  onBack: () => void;
  onPick: (level: number) => void;
  onEndless: () => void;
}) {
  const done = cleared.length;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader
        title="Poziomy"
        kicker={done === 0 ? "Kampania 1–60" : `${done} / ${CAMPAIGN_LEVELS}`}
        onBack={onBack}
      />
      <div className="mt-6 grid min-h-0 flex-1 grid-cols-3 content-start gap-2.5 overflow-y-auto pb-2">
        {Array.from({ length: CAMPAIGN_LEVELS }, (_, index) => index + 1).map((level) => {
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
      <button
        type="button"
        disabled={!endlessOpen}
        onClick={onEndless}
        className={`mt-3 flex h-[4.4rem] flex-col items-center justify-center rounded-[1.15rem] border backdrop-blur-md ${
          endlessOpen
            ? "border-[#e0f2fe]/28 bg-[#e0f2fe]/10 text-[#e0f2fe]"
            : "border-[#e0f2fe]/10 bg-black/25 text-[#e0f2fe]/35"
        }`}
      >
        <span className="text-[1.15rem] font-light">Nieskończone</span>
        <span className="mt-1 text-[12px] text-[#e0f2fe]/55">
          {endlessOpen
            ? endlessBest > 0
              ? `Najdalej: ${endlessBest}`
              : "Odblokowane"
            : `Po poziomie ${CAMPAIGN_LEVELS}`}
        </span>
      </button>
    </div>
  );
}

function ShopScreen({
  save,
  onBack,
  onNote,
  onPickTheme,
  onBuyTheme,
  onWatchAd,
}: {
  save: GameSave;
  onBack: () => void;
  onNote: (note: string) => void;
  onPickTheme: (id: ThemeId) => void;
  onBuyTheme: (id: ThemeId, price: number) => void;
  onWatchAd: () => void;
}) {
  const adReady = Date.now() - save.lastAdAt >= AD_COOLDOWN_MS;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader title="Sklep" kicker={`${save.crystals} kryształów`} onBack={onBack} />
      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-2">
        <p className="px-0.5 text-[11px] uppercase tracking-[0.28em] text-[#e0f2fe]/45">Zarabiaj</p>
        <button
          type="button"
          onClick={onWatchAd}
          className="flex h-[4.75rem] items-center justify-between rounded-[1.15rem] border border-[#e0f2fe]/16 bg-black/45 px-4 text-left backdrop-blur-md"
        >
          <span>
            <span className="block text-[17px] font-normal">Obejrzyj reklamę</span>
            <span className="mt-1 block text-[13px] text-[#e0f2fe]/50">
              {adReady ? `+${AD_CRYSTAL_REWARD} kryształów` : "Zaraz będzie dostępna"}
            </span>
          </span>
          <span className="text-[1.35rem] font-light tabular-nums text-[#f97316]">+{AD_CRYSTAL_REWARD}</span>
        </button>

        <p className="mt-3 px-0.5 text-[11px] uppercase tracking-[0.28em] text-[#e0f2fe]/45">Motywy</p>
        {THEMES.map((item) => {
          const unlocked = isThemeUnlocked(
            item,
            save.clearedCampaign,
            save.endlessBest,
            save.purchasedThemes,
          );
          const price = themeCrystalPrice(item);
          const active = save.themeId === item.id;
          const canBuy = !unlocked && price !== null && save.crystals >= price;

          return (
            <button
              key={item.id}
              type="button"
              disabled={!unlocked && !canBuy}
              onClick={() => {
                if (unlocked) {
                  onPickTheme(item.id);
                  return;
                }
                if (price !== null && canBuy) onBuyTheme(item.id, price);
                else if (price !== null) onNote(`Potrzebujesz ${price} kryształów`);
              }}
              className={`flex h-[4.75rem] items-center gap-3.5 rounded-[1.15rem] border px-3.5 text-left backdrop-blur-md ${
                active
                  ? "border-[#f97316]/70 bg-[#f97316]/15"
                  : unlocked || canBuy
                    ? "border-[#e0f2fe]/16 bg-black/45"
                    : "border-[#e0f2fe]/10 bg-black/25 opacity-55"
              }`}
            >
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${item.crystalCool[0]}, ${item.sky.a})`,
                }}
              >
                <span
                  className="block h-4 w-4 rotate-45"
                  style={{ background: unlocked || canBuy ? item.warm : "#64748b" }}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-normal">{item.name}</span>
                <span className="mt-1 block text-[13px] text-[#e0f2fe]/50">
                  {unlocked
                    ? active
                      ? "Aktywny"
                      : "Odblokowany"
                    : price !== null
                      ? `${themeUnlockRequirement(item)} · lub ${price}`
                      : themeUnlockRequirement(item)}
                </span>
              </span>
              {!unlocked && price !== null && (
                <span className="text-[15px] font-light tabular-nums text-[#e0f2fe]/70">{price}</span>
              )}
            </button>
          );
        })}

        <p className="mt-3 px-0.5 text-[11px] uppercase tracking-[0.28em] text-[#e0f2fe]/45">Wsparcie</p>
        <SettingRow
          label="Usuń reklamy"
          detail="Wkrótce — jednorazowy zakup"
          onClick={() => onNote("Płatności wkrótce")}
        />
        <SettingRow
          label="Paczka kryształów"
          detail="Wkrótce — mała / średnia / duża"
          onClick={() => onNote("Płatności wkrótce")}
        />
        <SettingRow
          label="Wsparcie twórcy"
          detail="Wkrótce — kosmetyczna odznaka"
          onClick={() => onNote("Płatności wkrótce")}
        />
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
  onDuel,
  onTutorial,
  onReset,
}: {
  save: GameSave;
  confirmReset: boolean;
  onBack: () => void;
  onToggleMuted: () => void;
  onToggleHaptics: () => void;
  onDuel: () => void;
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
        <SettingRow label="Pojedynek" detail="Wyścig na dwóch telefonach" onClick={onDuel} />
        <SettingRow label="Nauka" detail="Pokaż jeszcze raz" onClick={onTutorial} />
        <SettingRow
          label={confirmReset ? "Na pewno wyczyścić?" : "Resetuj postęp"}
          detail={confirmReset ? "Stuknij jeszcze raz" : "Poziomy i sklep wracają na start"}
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

function FeatureTile({
  label,
  detail,
  onClick,
  children,
}: {
  label: string;
  detail: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[4.5rem] items-center gap-3 rounded-[1.2rem] border border-[#e0f2fe]/16 bg-black/45 px-3 text-left text-[#e0f2fe] backdrop-blur-md active:scale-[0.98]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/30">{children}</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium leading-none">{label}</span>
        <span className="mt-1.5 block text-[11px] text-[#e0f2fe]/50">{detail}</span>
      </span>
    </button>
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
      className="flex h-[4.6rem] flex-col items-center justify-center gap-1.5 rounded-[1.15rem] border border-[#e0f2fe]/16 bg-black/45 text-[#e0f2fe] backdrop-blur-md active:scale-[0.98]"
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

function Diamond({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={className} style={style}>
      <path d="M5 0.6 9.2 5 5 9.4 0.8 5Z" fill="currentColor" />
    </svg>
  );
}

function PlayCrystal({ accent }: { accent: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M13 1.8 23.2 13 13 24.2 2.8 13Z" fill="#0b1020" fillOpacity="0.12" stroke="#0b1020" strokeWidth="1.4" />
      <path d="M13 7.2 18.2 13 13 18.8 7.8 13Z" fill={accent} />
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
      <path
        d="M6 14.5c2.2-4.8 6.2-6.6 10.2-6.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M13.2 6.2 16.4 8.1 14.2 11"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.2" cy="14.6" r="1.5" fill="#f97316" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <path
        d="M5.2 8.2h11.6l-0.8 8.2H6L5.2 8.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8 8.2V6.4a3 3 0 0 1 6 0v1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 11.2 12.4 14.6 11 13.4 9.6 14.6Z" fill="#f97316" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.07 7.07 0 0 0-1.63-.94l-.36-2.54A.48.48 0 0 0 14.9 2h-3.8a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.49.49 0 0 0-.59.22L3.73 8.47a.49.49 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.39.3.59.22l2.39-.96c.5.39 1.04.71 1.63.94l.36 2.54c.05.24.24.41.48.41h3.8c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z" />
    </svg>
  );
}

function DailyIcon({ accent }: { accent: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <circle cx="11" cy="11" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M11 7.2v4.1l2.6 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 3.2v1.4M11 17.4v1.4M3.2 11h1.4M17.4 11h1.4" stroke={accent} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function DuelIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <path
        d="M5.2 16.2 10.4 5.4 15.8 16.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M7.2 12h6.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="16.5" cy="5.8" r="1.55" fill="#f97316" />
    </svg>
  );
}

function EventIcon({ large = false }: { large?: boolean }) {
  const size = large ? 28 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <path
        d="M11 3.4 12.7 8.2 17.7 8.4 13.8 11.5 15.2 16.4 11 13.7 6.8 16.4 8.2 11.5 4.3 8.4 9.3 8.2Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="11" r="1.4" fill="#f97316" />
    </svg>
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
