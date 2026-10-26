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
import { GameBoard, type BoardMode, type ClearInfo } from "@/components/game/GameBoard";
import { LivingSky } from "@/components/game/LivingSky";
import { StudioCard } from "@/components/game/StudioCard";
import { ThemeBackdrop } from "@/components/game/ThemeBackdrop";
import {
  isLevelPlayable,
  mergeAlbumFromCleared,
  readSave,
  readServerSave,
  recordClearedLevel,
  resetProgress,
  subscribeSave,
  updateSave,
  type GameSave,
} from "@/components/game/storage";
import { TutorialBoard } from "@/components/game/TutorialBoard";
import {
  CONSTELLATIONS,
  isConstellationLevel,
  type ConstellationId,
} from "@/lib/engine/constellations";
import {
  getDailyChallenge,
  nextDailyStreak,
  visibleDailyStreak,
} from "@/lib/engine/daily";
import {
  AD_COOLDOWN_MS,
  AD_CRYSTAL_REWARD,
  CRYSTAL_PACKS,
  CRYSTAL_SHAPES,
  PERFECT_MOVE_BONUS,
  SOUND_PACKS,
  TRAIL_PRICE,
  themeCrystalPrice,
  type CrystalPackId,
  type CrystalShapeId,
  type SoundPackId,
} from "@/lib/engine/economy";
import { CAMPAIGN_LEVELS, isEndlessUnlocked, type ArenaChrome } from "@/lib/engine/graph";
import {
  getTheme,
  isThemeUnlocked,
  THEMES,
  themeChromeVars,
  themesUnlockedByClear,
  type ThemeId,
  type VisualTheme,
} from "@/lib/engine/themes";
import {
  LOCALE_OPTIONS,
  crystalPackPriceLabel,
  localeNativeName,
  resolveLocale,
  translatorForPreference,
  type LocalePreference,
  type TranslateFn,
} from "@/lib/i18n";

type Screen =
  | "tutorial"
  | "menu"
  | "levels"
  | "shop"
  | "settings"
  | "play"
  | "duel"
  | "event"
  | "modes"
  | "album";
type PlayMode = "campaign" | "daily" | "rush" | "master" | "echo";

const STUDIO_HOLD_MS = 2400;
const STUDIO_FADE_MS = 1300;

export function GameApp() {
  const save = useSyncExternalStore(subscribeSave, readSave, readServerSave);
  const theme = getTheme(save.themeId);
  const { t } = translatorForPreference(save.locale);
  const systemLocale = resolveLocale("auto");
  const daily = getDailyChallenge();
  const [screen, setScreen] = useState<Screen | "auto">("auto");
  const [studio, setStudio] = useState<"show" | "leave" | "done">("show");
  const [confirmReset, setConfirmReset] = useState(false);
  const [run, setRun] = useState(0);
  const [playMode, setPlayMode] = useState<PlayMode>("campaign");
  const [boardMode, setBoardMode] = useState<BoardMode>("classic");
  const [dailySeed, setDailySeed] = useState<number | undefined>(undefined);
  const [unlockNote, setUnlockNote] = useState<string | null>(null);
  const [rushResult, setRushResult] = useState<number | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [menuBand, setMenuBand] = useState<ArenaChrome | undefined>(undefined);
  const visible: Screen = screen === "auto" ? (save.tutorialSeen ? "menu" : "tutorial") : screen;
  const dailyDone = save.dailyClaimedOn === daily.day;
  const dailyStreak = visibleDailyStreak(save.dailyClaimedOn, save.dailyStreak, daily.day);

  // Uzupełnij album z postępu (stare save'y / clear bez wpisu).
  useEffect(() => {
    updateSave((current) => {
      const constellations = mergeAlbumFromCleared(
        current.clearedCampaign,
        current.constellations,
        current.level,
        current.endlessBest,
      );
      if (
        constellations.length === current.constellations.length &&
        constellations.every((id, index) => id === current.constellations[index])
      ) {
        return current;
      }
      return { ...current, constellations };
    });
  }, []);

  const play = (level: number, mode: PlayMode = "campaign") => {
    setPlayMode(mode);
    setBoardMode(
      mode === "rush" ? "rush" : mode === "master" ? "master" : mode === "echo" ? "echo" : "classic",
    );
    setRushResult(null);
    setDailySeed(undefined);
    updateSave((current) => {
      let next = Math.max(1, Math.floor(level));
      if (
        (mode === "campaign" || mode === "master" || mode === "echo") &&
        next <= CAMPAIGN_LEVELS &&
        !isLevelPlayable(next, current.clearedCampaign)
      ) {
        const peak =
          current.clearedCampaign.length > 0 ? Math.max(...current.clearedCampaign) : 0;
        next = Math.min(CAMPAIGN_LEVELS, Math.max(1, peak + 1));
      }
      return { ...current, level: next };
    });
    setRun((value) => value + 1);
    setScreen("play");
  };

  const playDaily = () => {
    const challenge = getDailyChallenge();
    setPlayMode("daily");
    setBoardMode("classic");
    setRushResult(null);
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

  const onCleared = (info: ClearInfo) => {
    let note: string | null = null;
    if (playMode === "rush") return;

    if (playMode === "daily") {
      const challenge = getDailyChallenge();
      updateSave((current) => {
        if (current.dailyClaimedOn === challenge.day) {
          note = t("daily_already");
          return current;
        }
        const perfectExtra = info.perfect ? PERFECT_MOVE_BONUS : 0;
        const streak = nextDailyStreak(current.dailyClaimedOn, current.dailyStreak, challenge.day);
        const crystals = challenge.reward + perfectExtra;
        note =
          streak > 1
            ? t("daily_streak_reward", { n: streak, crystals })
            : t("daily_reward", { n: crystals });
        return {
          ...current,
          dailyClaimedOn: challenge.day,
          dailyStreak: streak,
          crystals: current.crystals + crystals,
        };
      });
      if (note) setUnlockNote(note);
      return;
    }

    updateSave((current) => {
      const unlocked = themesUnlockedByClear(
        info.level,
        current.clearedCampaign,
        current.endlessBest,
        current.purchasedThemes,
      );
      const { save, reward } = recordClearedLevel(current, info.level, {
        perfect: info.perfect,
        constellationId: info.constellationId as ConstellationId | undefined,
      });
      if (reward.constellation) {
        const figure = CONSTELLATIONS.find((item) => item.id === reward.constellation);
        note = figure
          ? t("album_unlock", { name: figure.name, n: reward.crystals })
          : t("shop_ad_ready", { n: reward.crystals });
      } else if (unlocked[0]) note = `${t("shop_unlocked")}: ${unlocked[0]!.name}`;
      else if (!reward.alreadyCleared && reward.crystals > 0) {
        note = t("shop_ad_ready", { n: reward.crystals });
      }
      return save;
    });
    if (note) setUnlockNote(note);
  };

  let stage: ReactNode;
  if (visible === "play") {
    if (rushResult !== null) {
      stage = (
        <div
          className="theme-chrome game-shell fixed inset-0 flex items-center justify-center"
          style={{ background: theme.ink, ...themeChromeVars(theme) }}
        >
          <div className="play-bleed">
            <ThemeBackdrop theme={theme} />
          </div>
          <div className="play-column z-10 flex flex-col items-center justify-center px-6 text-center">
            <p className="ui-kicker text-[11px] uppercase tracking-[0.32em]">{t("mode_rush")}</p>
            <h2 className="mt-3 text-[2.4rem] font-light tracking-[-0.03em]">{t("rush_over")}</h2>
            <p className="ui-accent mt-4 text-[3.5rem] font-light tabular-nums">{rushResult}</p>
            <p className="ui-muted mt-1 text-[14px]">{t("layouts_row")}</p>
            <button
              type="button"
              onClick={() => play(1, "rush")}
              className="play-seal mt-10 h-14 w-full max-w-xs rounded-[1.15rem] text-[16px] font-medium"
            >
              {t("rush_again")}
            </button>
            <button
              type="button"
              onClick={() => {
                setRushResult(null);
                setScreen("menu");
              }}
              className="ui-muted mt-3 h-12 w-full max-w-xs text-[14px]"
            >
              {t("menu")}
            </button>
          </div>
        </div>
      );
    } else {
      stage = (
        <GameBoard
          key={run}
          level={save.level}
          muted={save.muted}
          haptics={save.haptics}
          theme={theme}
          soundPack={save.soundPack}
          crystalShape={save.crystalShape}
          trail={save.trailOwned && save.trailEnabled}
          mode={boardMode}
          seed={playMode === "daily" ? dailySeed : undefined}
          race={playMode === "daily"}
          t={t}
          constellationIntro={
            playMode !== "daily" &&
            playMode !== "rush" &&
            boardMode === "classic" &&
            !save.constellationIntroSeen &&
            isConstellationLevel(save.level)
          }
          onConstellationIntroSeen={() =>
            updateSave((current) => ({ ...current, constellationIntroSeen: true }))
          }
          onMenu={() => setScreen("menu")}
          onMuted={(muted) => updateSave((current) => ({ ...current, muted }))}
          onCleared={onCleared}
          onAdvance={(level) => {
            if (playMode === "daily" || playMode === "rush") return;
            updateSave((current) => ({ ...current, level }));
          }}
          onRushOver={(score) => setRushResult(score)}
        />
      );
    }
  } else if (visible === "duel") {
    stage = (
      <DuelLobby
        muted={save.muted}
        haptics={save.haptics}
        theme={theme}
        soundPack={save.soundPack}
        crystalShape={save.crystalShape}
        trail={save.trailOwned && save.trailEnabled}
        t={t}
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
        className="theme-chrome game-shell fixed inset-0 flex items-center justify-center"
        style={{ background: theme.ink, ...themeChromeVars(theme) }}
      >
        <div className="play-bleed">
          <ThemeBackdrop theme={theme} />
        </div>
        <div ref={shellRef} className="play-column z-10">
          {visible === "menu" && (
            <LivingSky mood="menu" band={menuBand} theme={theme} />
          )}
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
                t={t}
                level={save.level}
                muted={save.muted}
                crystals={save.crystals}
                theme={theme}
                dailyDone={dailyDone}
                dailyReward={daily.reward}
                dailyStreak={dailyStreak}
                albumCount={save.constellations.length}
                onPlay={() => play(save.level)}
                onDaily={playDaily}
                onDuel={() => setScreen("duel")}
                onModes={() => setScreen("modes")}
                onLevels={() => setScreen("levels")}
                onShop={() => setScreen("shop")}
                onAlbum={() => setScreen("album")}
                onTutorial={openTutorial}
                onToggleMuted={() => updateSave((current) => ({ ...current, muted: !current.muted }))}
                onSettings={() => {
                  setConfirmReset(false);
                  setScreen("settings");
                }}
              />
            )}
            {visible === "modes" && (
              <ModesScreen
                t={t}
                onBack={() => setScreen("menu")}
                onRush={() => play(1, "rush")}
                onMaster={() => play(Math.min(save.level, CAMPAIGN_LEVELS) || 1, "master")}
                onEcho={() => play(Math.min(save.level, CAMPAIGN_LEVELS) || 1, "echo")}
              />
            )}
            {visible === "album" && (
              <AlbumScreen
                t={t}
                unlocked={save.constellations}
                onBack={() => setScreen("menu")}
              />
            )}
            {visible === "event" && (
              <EventScreen theme={theme} onBack={() => setScreen("menu")} onShop={() => setScreen("shop")} />
            )}
            {visible === "levels" && (
              <LevelSelect
                t={t}
                theme={theme}
                current={save.level}
                cleared={save.clearedCampaign}
                endlessBest={save.endlessBest}
                endlessOpen={isEndlessUnlocked(save.clearedCampaign)}
                onBack={() => setScreen("menu")}
                onPick={(level) => play(level)}
                onEndless={() =>
                  play(Math.max(CAMPAIGN_LEVELS + 1, save.endlessBest || CAMPAIGN_LEVELS + 1))
                }
              />
            )}
            {visible === "shop" && (
              <ShopScreen
                t={t}
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
                  setUnlockNote(t("theme_unlocked"));
                }}
                onPickShape={(id) => updateSave((current) => ({ ...current, crystalShape: id }))}
                onBuyShape={(id, price) => {
                  updateSave((current) => {
                    if (current.crystals < price) return current;
                    if (current.purchasedShapes.includes(id)) return current;
                    return {
                      ...current,
                      crystals: current.crystals - price,
                      purchasedShapes: [...current.purchasedShapes, id],
                      crystalShape: id,
                    };
                  });
                  setUnlockNote(t("shape_unlocked"));
                }}
                onPickSound={(id) => updateSave((current) => ({ ...current, soundPack: id }))}
                onBuySound={(id, price) => {
                  updateSave((current) => {
                    if (current.crystals < price) return current;
                    if (current.purchasedSounds.includes(id)) return current;
                    return {
                      ...current,
                      crystals: current.crystals - price,
                      purchasedSounds: [...current.purchasedSounds, id],
                      soundPack: id,
                    };
                  });
                  setUnlockNote(t("sound_unlocked"));
                }}
                onBuyTrail={() => {
                  updateSave((current) => {
                    if (current.trailOwned) {
                      return { ...current, trailEnabled: !current.trailEnabled };
                    }
                    if (current.crystals < TRAIL_PRICE) return current;
                    return {
                      ...current,
                      crystals: current.crystals - TRAIL_PRICE,
                      trailOwned: true,
                      trailEnabled: true,
                    };
                  });
                  setUnlockNote(save.trailOwned ? t("trail_toggled") : t("trail_unlocked"));
                }}
                onBuyPack={(packId) => {
                  const pack = CRYSTAL_PACKS.find((item) => item.id === packId);
                  if (!pack) return;
                  const name =
                    pack.id === "small"
                      ? t("pack_small")
                      : pack.id === "medium"
                        ? t("pack_medium")
                        : t("pack_large");
                  updateSave((current) => ({
                    ...current,
                    crystals: current.crystals + pack.crystals,
                  }));
                  setUnlockNote(t("pack_claimed", { n: pack.crystals, name }));
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
                  setUnlockNote(ok ? t("ad_reward", { n: AD_CRYSTAL_REWARD }) : t("ad_wait"));
                }}
              />
            )}
            {visible === "settings" && (
              <SettingsScreen
                t={t}
                save={save}
                theme={theme}
                systemLocale={systemLocale}
                confirmReset={confirmReset}
                onBack={() => setScreen("menu")}
                onToggleMuted={() => updateSave((current) => ({ ...current, muted: !current.muted }))}
                onToggleHaptics={() =>
                  updateSave((current) => ({ ...current, haptics: !current.haptics }))
                }
                onLocale={(next) => updateSave((current) => ({ ...current, locale: next }))}
                onDuel={() => setScreen("duel")}
                onTutorial={openTutorial}
                onReset={() => {
                  if (!confirmReset) {
                    setConfirmReset(true);
                    return;
                  }
                  resetProgress({
                    muted: save.muted,
                    haptics: save.haptics,
                    tutorialSeen: true,
                    locale: save.locale,
                  });
                  setConfirmReset(false);
                  setPlayMode("campaign");
                  setBoardMode("classic");
                  setDailySeed(undefined);
                  setRushResult(null);
                  setRun((value) => value + 1);
                  setUnlockNote(t("progress_reset"));
                  setScreen("menu");
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
          className="theme-chrome hint-in pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 mx-auto w-fit rounded-full border bg-black/70 px-5 py-2.5 text-sm backdrop-blur-md ui-chip"
          style={themeChromeVars(theme)}
        >
          {unlockNote}
        </p>
      )}
    </>
  );
}

function MainMenu({
  t,
  level,
  muted,
  crystals,
  theme,
  dailyDone,
  dailyReward,
  dailyStreak,
  albumCount,
  onPlay,
  onDaily,
  onDuel,
  onModes,
  onLevels,
  onShop,
  onAlbum,
  onTutorial,
  onToggleMuted,
  onSettings,
}: {
  t: TranslateFn;
  level: number;
  muted: boolean;
  crystals: number;
  theme: VisualTheme;
  dailyDone: boolean;
  dailyReward: number;
  dailyStreak: number;
  albumCount: number;
  onPlay: () => void;
  onDaily: () => void;
  onDuel: () => void;
  onModes: () => void;
  onLevels: () => void;
  onShop: () => void;
  onAlbum: () => void;
  onTutorial: () => void;
  onToggleMuted: () => void;
  onSettings: () => void;
}) {
  const label =
    level > CAMPAIGN_LEVELS
      ? t("endless_n", { n: level - CAMPAIGN_LEVELS })
      : t("level_n", { n: level });
  return (
    <div className="flex h-full flex-col">
      <div className="relative pt-1">
        <button
          type="button"
          onClick={onToggleMuted}
          aria-pressed={muted}
          aria-label={muted ? t("mute_on") : t("mute_off")}
          className="ui-chip absolute left-0 top-0 z-30 grid h-11 w-11 place-items-center rounded-full border bg-black/40 backdrop-blur-md"
        >
          <SpeakerIcon muted={muted} />
        </button>
        <button
          type="button"
          onClick={onSettings}
          aria-label={t("settings")}
          className="ui-chip absolute right-0 top-0 z-30 grid h-11 w-11 place-items-center rounded-full border bg-black/40 backdrop-blur-md"
        >
          <GearIcon />
        </button>
        <div data-menu-mark className="px-12 text-center">
          <h1 className="text-[3.2rem] font-light leading-[0.84] tracking-[-0.045em]">
            Tangle
            <br />
            Duel
          </h1>
          <div className="mx-auto mt-3.5 flex items-center justify-center gap-3 opacity-70">
            <span className="h-px w-9 bg-current opacity-40" />
            <Diamond style={{ color: theme.warm }} />
            <span className="h-px w-9 bg-current opacity-40" />
          </div>
          <p className="ui-muted mt-2.5 text-[12px] tabular-nums tracking-wide">
            {t("crystals_count", { n: crystals })}
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <button
          type="button"
          data-menu-play
          onClick={onPlay}
          className="play-seal flex h-[4.5rem] w-full items-center gap-3.5 rounded-[1.35rem] px-3.5 text-left active:scale-[0.985]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/10">
            <PlayCrystal accent={theme.warm} ink={theme.ink} />
          </span>
          <span className="min-w-0">
            <span className="block text-[1.4rem] font-medium leading-none tracking-wide">{t("play")}</span>
            <span className="mt-1.5 block text-[13px] font-normal opacity-55">{label}</span>
          </span>
          <span className="ml-auto pr-2 text-[2rem] font-light tabular-nums leading-none">
            {level > CAMPAIGN_LEVELS ? "∞" : level}
          </span>
        </button>

        <button
          type="button"
          onClick={onDaily}
          className={`mt-2.5 flex h-[4.35rem] w-full items-center gap-3.5 rounded-[1.25rem] border px-3.5 text-left backdrop-blur-md active:scale-[0.985] ${
            dailyDone ? "ui-panel" : "ui-panel-active"
          }`}
          style={
            dailyDone
              ? undefined
              : {
                  borderColor: `${theme.warm}73`,
                  background: `${theme.warm}24`,
                  boxShadow: `0 0 28px ${theme.warm}2e`,
                }
          }
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black/25">
            <DailyIcon accent={dailyDone ? theme.ice : theme.warm} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[1.15rem] font-medium leading-none">{t("daily")}</span>
            <span className={`mt-1.5 block text-[12px] ${dailyDone ? "ui-muted" : "opacity-80"}`}>
              {dailyDone ? t("daily_done") : t("daily_layout", { n: dailyReward })}
            </span>
          </span>
          {dailyStreak > 0 && (
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5"
              style={{
                background: `${theme.warm}22`,
                color: theme.warm,
              }}
              aria-label={t("streak_aria", { n: dailyStreak })}
            >
              <StreakFlame accent={theme.warm} />
              <span className="text-[15px] font-medium tabular-nums leading-none">{dailyStreak}</span>
            </span>
          )}
        </button>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <FeatureTile label={t("duel")} detail={t("duel_detail")} onClick={onDuel}>
            <DuelIcon accent={theme.warm} />
          </FeatureTile>
          <FeatureTile label={t("modes")} detail={t("modes_detail")} onClick={onModes}>
            <EventIcon accent={theme.warm} />
          </FeatureTile>
        </div>

        <div className="mt-2.5 grid grid-cols-4 gap-2">
          <DockTile label={t("levels")} onClick={onLevels}>
            <LevelsIcon />
          </DockTile>
          <DockTile label={t("album")} onClick={onAlbum}>
            <AlbumIcon count={albumCount} accent={theme.warm} />
          </DockTile>
          <DockTile label={t("shop")} onClick={onShop}>
            <ShopIcon accent={theme.warm} />
          </DockTile>
          <DockTile label={t("how_to_play")} onClick={onTutorial}>
            <LearnIcon accent={theme.warm} />
          </DockTile>
        </div>
      </div>
    </div>
  );
}

function ModesScreen({
  t,
  onBack,
  onRush,
  onMaster,
  onEcho,
}: {
  t: TranslateFn;
  onBack: () => void;
  onRush: () => void;
  onMaster: () => void;
  onEcho: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader title={t("modes")} kicker={t("modes_kicker")} backLabel={t("back_menu")} onBack={onBack} />
      <div className="mt-6 flex flex-col gap-3">
        <ModeRow
          title={t("mode_rush")}
          detail={t("mode_rush_detail")}
          tag={t("mode_rush_tag")}
          onClick={onRush}
          icon={<ModeRushIcon />}
        />
        <ModeRow
          title={t("mode_master")}
          detail={t("mode_master_detail")}
          tag={t("mode_master_tag")}
          onClick={onMaster}
          icon={<ModeMasterIcon />}
        />
        <ModeRow
          title={t("mode_echo")}
          detail={t("mode_echo_detail")}
          tag={t("mode_echo_tag")}
          onClick={onEcho}
          icon={<ModeEchoIcon />}
        />
      </div>
      <p className="ui-muted mt-auto pb-2 text-center text-[12px]">{t("modes_footer")}</p>
    </div>
  );
}

function ModeRow({
  title,
  detail,
  tag,
  onClick,
  icon,
}: {
  title: string;
  detail: string;
  tag: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ui-panel flex min-h-[5.35rem] items-center gap-3.5 rounded-[1.35rem] border px-3.5 py-3 text-left backdrop-blur-md active:scale-[0.985]"
    >
      <span
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
        style={{ background: "var(--ui-warm-soft)", color: "var(--ui-warm)" }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="ui-accent block text-[10px] uppercase tracking-[0.22em]">{tag}</span>
        <span className="mt-1 block text-[1.2rem] font-medium leading-none tracking-wide">{title}</span>
        <span className="ui-muted mt-1.5 block text-[12px] leading-snug">{detail}</span>
      </span>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="ui-muted shrink-0 opacity-70">
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

function ModeRushIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden fill="none">
      <path
        d="M15.2 3.2 8.4 15.1h5.1L11.6 24.8 21.2 11.4h-5.4L18.4 3.2Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
    </svg>
  );
}

function ModeMasterIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden fill="none">
      <path
        d="M7.2 8.2 10.4 5.4h7.2L20.8 8.2v3.2L14 14.6 7.2 11.4V8.2Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path d="M14 14.6V22.4" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      <path d="M9.2 22.4h9.6" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      <circle cx="10.6" cy="9.4" r="1.1" fill="currentColor" />
      <circle cx="17.4" cy="9.4" r="1.1" fill="currentColor" />
    </svg>
  );
}

function ModeEchoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden fill="none">
      <circle cx="10.2" cy="14" r="2.4" fill="currentColor" />
      <path
        d="M14.2 9.2a7.2 7.2 0 0 1 0 9.6"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M17.4 6.4a11.2 11.2 0 0 1 0 15.2"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M20.4 3.8a15 15 0 0 1 0 20.4"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

function kindLabel(kind: "animal" | "plant" | "object", t: TranslateFn): string {
  if (kind === "animal") return t("kind_animal");
  if (kind === "plant") return t("kind_plant");
  return t("kind_object");
}

function AlbumScreen({
  t,
  unlocked,
  onBack,
}: {
  t: TranslateFn;
  unlocked: readonly string[];
  onBack: () => void;
}) {
  const open = new Set(unlocked);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = previewId ? CONSTELLATIONS.find((item) => item.id === previewId) : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <ScreenHeader
        title={t("album")}
        kicker={t("album_kicker", { n: open.size, total: CONSTELLATIONS.length })}
        backLabel={t("back_menu")}
        onBack={onBack}
      />
      <div className="mt-6 grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pb-2">
        {CONSTELLATIONS.map((figure) => {
          const found = open.has(figure.id);
          return (
            <button
              key={figure.id}
              type="button"
              disabled={!found}
              onClick={() => {
                if (found) setPreviewId(figure.id);
              }}
              className={`flex min-h-[9.4rem] flex-col items-center justify-center rounded-[1.2rem] border px-3 py-3.5 text-center backdrop-blur-md ${
                found ? "ui-panel-star active:scale-[0.98]" : "ui-panel-locked"
              }`}
            >
              {found ? (
                <ConstellationSketch figureId={figure.id} lit />
              ) : (
                <LockedConstellationMark />
              )}
              <span className="mt-2.5 text-[15px] font-normal">{found ? figure.name : "???"}</span>
              <span className="ui-muted mt-1 text-[11px]">
                {found
                  ? t("album_found_meta", { kind: kindLabel(figure.kind, t), n: figure.level })
                  : t("album_locked_meta", { n: figure.level })}
              </span>
            </button>
          );
        })}
      </div>
      <p className="ui-muted pb-2 text-center text-[12px]">{t("album_hint")}</p>

      {preview && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/55 px-4 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-16 backdrop-blur-[3px]">
          <div className="ui-panel flex flex-col items-center rounded-[1.45rem] border px-5 py-6">
            <p className="ui-kicker text-[11px] uppercase tracking-[0.28em]">
              {t("album_found_meta", { kind: kindLabel(preview.kind, t), n: preview.level })}
            </p>
            <h2 className="mt-2 text-[1.85rem] font-light tracking-[-0.03em]">{preview.name}</h2>
            <div className="mt-5 grid place-items-center">
              <ConstellationSketch figureId={preview.id} lit size={168} />
            </div>
            <p className="ui-muted mt-4 text-center text-[13px] leading-relaxed">
              {preview.reveal}. {t("album_preview_hint")}
            </p>
            <button
              type="button"
              className="play-seal mt-5 h-14 w-full rounded-[1.15rem] text-[15px] font-medium"
              onClick={() => setPreviewId(null)}
            >
              {t("album_close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LockedConstellationMark() {
  return (
    <svg width="72" height="72" viewBox="-1.1 -1.1 2.2 2.2" aria-hidden>
      {[
        [0, -0.55],
        [0.48, -0.18],
        [0.3, 0.48],
        [-0.3, 0.48],
        [-0.48, -0.18],
        [0, 0.05],
      ].map(([x, y], index) => (
        <circle
          key={index}
          cx={x}
          cy={y}
          r={0.07}
          fill="#64748b"
          opacity={0.55}
        />
      ))}
    </svg>
  );
}

function ConstellationSketch({
  figureId,
  lit,
  size = 72,
}: {
  figureId: string;
  lit?: boolean;
  size?: number;
}) {
  const figure = CONSTELLATIONS.find((item) => item.id === figureId);
  if (!figure) return <span className="text-[1.6rem]">·</span>;
  const glow = lit !== false;
  const stroke = glow ? "var(--ui-warm)" : "#64748b";
  const fill = glow ? "var(--ui-ice)" : "#475569";
  const filterId = `const-glow-${figure.id}-${size}`;
  const strokeW = glow ? (size > 100 ? 0.07 : 0.085) : 0.055;
  const nodeR = glow ? (size > 100 ? 0.075 : 0.09) : 0.065;
  return (
    <svg width={size} height={size} viewBox="-1.15 -1.15 2.3 2.3" aria-hidden>
      {glow && (
        <defs>
          <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={size > 100 ? 0.05 : 0.04} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <g filter={glow ? `url(#${filterId})` : undefined}>
        {figure.edges.map((edge, index) => {
          const a = figure.solved[edge.a];
          const b = figure.solved[edge.b];
          if (!a || !b) return null;
          return (
            <line
              key={index}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={stroke}
              strokeWidth={strokeW}
              strokeLinecap="round"
              opacity={glow ? 0.95 : 0.45}
            />
          );
        })}
        {figure.solved.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={nodeR} fill={fill} />
        ))}
      </g>
    </svg>
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
        <div className="ui-panel rounded-[1.35rem] border px-5 py-6 backdrop-blur-md">
          <div
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: `${theme.warm}26` }}
          >
            <EventIcon large accent={theme.warm} />
          </div>
          <h2 className="mt-5 text-center text-[1.65rem] font-light tracking-[-0.03em]">Mgławica weekendu</h2>
          <p className="ui-muted mt-3 text-center text-[14px] font-light leading-relaxed">
            Specjalny tor poziomów i nagrody motywowe wrócą wkrótce. Zbieraj kryształy w sklepie, żeby być gotowym.
          </p>
        </div>
        <button
          type="button"
          onClick={onShop}
          className="ui-panel mt-4 h-14 w-full rounded-[1.15rem] border text-[15px] backdrop-blur-md"
        >
          Idź do sklepu
        </button>
        <p className="ui-muted mt-auto pb-2 text-center text-[12px]">Eventy rotują co tydzień</p>
      </div>
    </div>
  );
}

function LevelSelect({
  t,
  theme,
  current,
  cleared,
  endlessBest,
  endlessOpen,
  onBack,
  onPick,
  onEndless,
}: {
  t: TranslateFn;
  theme: VisualTheme;
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
        title={t("levels_title")}
        kicker={
          done === 0
            ? t("levels_kicker_empty")
            : t("levels_kicker_progress", { n: done, total: CAMPAIGN_LEVELS })
        }
        backLabel={t("back_menu")}
        onBack={onBack}
      />
      <div className="mt-6 grid min-h-0 flex-1 grid-cols-3 content-start gap-2.5 overflow-y-auto pb-2">
        {Array.from({ length: CAMPAIGN_LEVELS }, (_, index) => index + 1).map((level) => {
          const clearedLevel = cleared.includes(level);
          const open = isLevelPlayable(level, cleared);
          const active = level === current && open;
          const star = isConstellationLevel(level);
          const tone = active
            ? "ui-panel-active"
            : !open
              ? "ui-panel-locked"
              : star
                ? "ui-panel-star"
                : clearedLevel
                  ? "ui-panel-soft"
                  : "ui-panel";
          return (
            <button
              key={level}
              type="button"
              disabled={!open}
              onClick={() => {
                if (open) onPick(level);
              }}
              className={`flex h-[4.6rem] flex-col items-center justify-center rounded-[1.15rem] border backdrop-blur-md ${
                open ? "active:scale-[0.98]" : "opacity-35"
              } ${tone}`}
            >
              {star && open ? (
                <span className="ui-accent mb-0.5 text-[10px]">✦</span>
              ) : clearedLevel ? (
                <Diamond className="mb-0.5" style={{ color: theme.ice }} />
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
          endlessOpen ? "ui-panel-soft" : "ui-panel-locked"
        }`}
      >
        <span className="text-[1.15rem] font-light">{t("endless")}</span>
        <span className="ui-muted mt-1 text-[12px]">
          {endlessOpen
            ? endlessBest > 0
              ? t("endless_record", { n: endlessBest })
              : t("endless_unlocked")
            : t("endless_locked", { n: CAMPAIGN_LEVELS })}
        </span>
      </button>
    </div>
  );
}

function themeUnlockLabel(theme: VisualTheme, t: TranslateFn): string {
  if (theme.unlockAt <= 0 && theme.unlockEndless <= 0) return t("theme_from_start");
  if (theme.unlockEndless > 0) return t("endless_n", { n: theme.unlockEndless });
  return t("level_n", { n: theme.unlockAt });
}

function packCopy(id: CrystalPackId, t: TranslateFn): { name: string; detail: string } {
  if (id === "small") return { name: t("pack_small"), detail: t("pack_small_detail") };
  if (id === "medium") return { name: t("pack_medium"), detail: t("pack_medium_detail") };
  return { name: t("pack_large"), detail: t("pack_large_detail") };
}

function ShopScreen({
  t,
  save,
  onBack,
  onNote,
  onPickTheme,
  onBuyTheme,
  onPickShape,
  onBuyShape,
  onPickSound,
  onBuySound,
  onBuyTrail,
  onBuyPack,
  onWatchAd,
}: {
  t: TranslateFn;
  save: GameSave;
  onBack: () => void;
  onNote: (note: string) => void;
  onPickTheme: (id: ThemeId) => void;
  onBuyTheme: (id: ThemeId, price: number) => void;
  onPickShape: (id: CrystalShapeId) => void;
  onBuyShape: (id: CrystalShapeId, price: number) => void;
  onPickSound: (id: SoundPackId) => void;
  onBuySound: (id: SoundPackId, price: number) => void;
  onBuyTrail: () => void;
  onBuyPack: (id: CrystalPackId) => void;
  onWatchAd: () => void;
}) {
  const adReady = Date.now() - save.lastAdAt >= AD_COOLDOWN_MS;
  const tile =
    "ui-panel flex min-h-[4.75rem] items-center gap-3.5 rounded-[1.15rem] border px-3.5 py-3 text-left backdrop-blur-md";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader
        title={t("shop_title")}
        kicker={t("crystals_count", { n: save.crystals })}
        backLabel={t("back_menu")}
        onBack={onBack}
      />
      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
        <p className="ui-kicker px-0.5 pt-1 text-[11px] uppercase tracking-[0.28em]">{t("shop_earn")}</p>
        <button type="button" onClick={onWatchAd} className={`${tile} justify-between`}>
          <span>
            <span className="block text-[17px] font-normal">{t("shop_watch_ad")}</span>
            <span className="ui-muted mt-1 block text-[13px]">
              {adReady ? t("shop_ad_ready", { n: AD_CRYSTAL_REWARD }) : t("shop_ad_wait")}
            </span>
          </span>
          <span className="ui-accent text-[1.35rem] font-light tabular-nums">+{AD_CRYSTAL_REWARD}</span>
        </button>

        <p className="ui-kicker mt-2 px-0.5 pt-1 text-[11px] uppercase tracking-[0.28em]">{t("shop_themes")}</p>
        <div className="flex flex-col gap-3">
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
            const unlock = themeUnlockLabel(item, t);

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
                  else if (price !== null) onNote(t("need_crystals", { n: price }));
                }}
                className={`${tile} ${
                  active ? "ui-panel-active" : unlocked || canBuy ? "" : "ui-panel-locked opacity-55"
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
                  <span className="ui-muted mt-1 block text-[13px]">
                    {unlocked
                      ? active
                        ? t("shop_active")
                        : t("shop_unlocked")
                      : price !== null
                        ? t("unlock_or_buy", { req: unlock, price })
                        : unlock}
                  </span>
                </span>
                {!unlocked && price !== null && (
                  <span className="ui-muted text-[15px] font-light tabular-nums">{price}</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="ui-kicker mt-2 px-0.5 pt-1 text-[11px] uppercase tracking-[0.28em]">{t("shop_shapes")}</p>
        <div className="flex flex-col gap-3">
          {CRYSTAL_SHAPES.map((shape) => {
            const owned = shape.price === 0 || save.purchasedShapes.includes(shape.id);
            const active = save.crystalShape === shape.id;
            const canBuy = !owned && save.crystals >= shape.price;
            return (
              <button
                key={shape.id}
                type="button"
                disabled={!owned && !canBuy}
                onClick={() => {
                  if (owned) onPickShape(shape.id);
                  else if (canBuy) onBuyShape(shape.id, shape.price);
                  else onNote(t("need_crystals", { n: shape.price }));
                }}
                className={`${tile} ${
                  active ? "ui-panel-active" : owned || canBuy ? "" : "ui-panel-locked opacity-55"
                }`}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/30">
                  <ShapePreview id={shape.id} active={owned || canBuy} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-normal">{shape.name}</span>
                  <span className="ui-muted mt-1 block text-[13px]">
                    {owned ? (active ? t("shop_active_board") : shape.detail) : shape.detail}
                  </span>
                </span>
                {!owned && (
                  <span className="ui-muted text-[15px] font-light tabular-nums">{shape.price}</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="ui-kicker mt-2 px-0.5 pt-1 text-[11px] uppercase tracking-[0.28em]">{t("shop_sounds")}</p>
        <div className="flex flex-col gap-3">
          {SOUND_PACKS.map((pack) => {
            const owned = pack.price === 0 || save.purchasedSounds.includes(pack.id);
            const active = save.soundPack === pack.id;
            const canBuy = !owned && save.crystals >= pack.price;
            return (
              <button
                key={pack.id}
                type="button"
                disabled={!owned && !canBuy}
                onClick={() => {
                  if (owned) onPickSound(pack.id);
                  else if (canBuy) onBuySound(pack.id, pack.price);
                  else onNote(t("need_crystals", { n: pack.price }));
                }}
                className={`${tile} ${
                  active ? "ui-panel-active" : owned || canBuy ? "" : "ui-panel-locked opacity-55"
                }`}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/30">
                  <SoundPackIcon id={pack.id} active={owned || canBuy} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-normal">{pack.name}</span>
                  <span className="ui-muted mt-1 block text-[13px]">
                    {owned ? (active ? t("shop_active_sound") : pack.detail) : pack.detail}
                  </span>
                </span>
                {!owned && (
                  <span className="ui-muted text-[15px] font-light tabular-nums">{pack.price}</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="ui-kicker mt-2 px-0.5 pt-1 text-[11px] uppercase tracking-[0.28em]">{t("shop_effects")}</p>
        <button
          type="button"
          onClick={() => {
            if (!save.trailOwned && save.crystals < TRAIL_PRICE) {
              onNote(t("need_crystals", { n: TRAIL_PRICE }));
              return;
            }
            onBuyTrail();
          }}
          className={`${tile} ${
            save.trailOwned && save.trailEnabled ? "ui-panel-active" : ""
          }`}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/30">
            <TrailIcon active={save.trailOwned} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-normal">{t("trail")}</span>
            <span className="ui-muted mt-1 block text-[13px]">
              {save.trailOwned
                ? save.trailEnabled
                  ? t("trail_on")
                  : t("trail_off")
                : t("trail_buy")}
            </span>
          </span>
          <span className="ui-muted text-[15px] font-light tabular-nums">
            {save.trailOwned ? (save.trailEnabled ? "ON" : "OFF") : TRAIL_PRICE}
          </span>
        </button>

        <p className="ui-kicker mt-2 px-0.5 pt-1 text-[11px] uppercase tracking-[0.28em]">
          {t("shop_packs")}
        </p>
        <div className="flex flex-col gap-3">
          {CRYSTAL_PACKS.map((pack) => {
            const copy = packCopy(pack.id, t);
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => onBuyPack(pack.id)}
                className={`${tile}`}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/30">
                  <CrystalPackIcon size={pack.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-normal">{copy.name}</span>
                  <span className="ui-muted mt-1 block text-[13px]">
                    {copy.detail} · +{pack.crystals}
                  </span>
                </span>
                <span className="ui-accent text-[14px] font-medium tabular-nums">
                  {crystalPackPriceLabel(pack.id, save.locale)}
                </span>
              </button>
            );
          })}
        </div>

        <p className="ui-kicker mt-2 px-0.5 pt-1 text-[11px] uppercase tracking-[0.28em]">{t("shop_support")}</p>
        <div className="flex flex-col gap-3">
          <SettingRow
            label={t("remove_ads")}
            detail={t("remove_ads_detail")}
            onClick={() => onNote(t("payments_soon"))}
          />
        </div>
      </div>
    </div>
  );
}

function TrailIcon({ active }: { active: boolean }) {
  const spark = active ? "var(--ui-warm)" : "#64748b";
  const crystal = active ? "var(--ui-ice)" : "#94a3b8";
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <circle cx="5.5" cy="20.5" r="1.35" fill={spark} opacity="0.35" />
      <circle cx="9" cy="17.2" r="1.55" fill={spark} opacity="0.5" />
      <circle cx="12.2" cy="14.2" r="1.75" fill={spark} opacity="0.7" />
      <circle cx="15.2" cy="11.5" r="1.9" fill={spark} opacity="0.85" />
      <path
        d="M21.2 4.8 25.2 10.2 21.2 15.6 17.2 10.2Z"
        fill={crystal}
        fillOpacity="0.95"
      />
      <path d="M21.2 7.6 23.4 10.2 21.2 12.8 19 10.2Z" fill={spark} fillOpacity="0.9" />
    </svg>
  );
}

function SoundPackIcon({ id, active }: { id: SoundPackId; active: boolean }) {
  const ink = active ? "var(--ui-ice)" : "#64748b";
  const accent = active ? "var(--ui-warm)" : "#94a3b8";
  if (id === "chimes") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="none">
        <path d="M12 3.2v2.4" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M7.2 8.2v8.2M12 7.2v10.2M16.8 8.8v7" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="7.2" cy="17.6" r="1.5" fill={accent} />
        <circle cx="12" cy="18.6" r="1.6" fill={accent} />
        <circle cx="16.8" cy="17" r="1.5" fill={accent} />
      </svg>
    );
  }
  if (id === "lute") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="none">
        <ellipse cx="10.2" cy="14.2" rx="5.2" ry="5.6" stroke={ink} strokeWidth="1.4" />
        <path d="M14.2 9.4 19.6 4.2" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="19.8" cy="3.9" r="1.3" fill={accent} />
        <circle cx="10.2" cy="14.2" r="1.6" fill={accent} />
      </svg>
    );
  }
  if (id === "glass") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="none">
        <path d="M5.2 16.5h13.6" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
        <rect x="6.2" y="8.2" width="2.4" height="8" rx="1.1" fill={ink} opacity="0.85" />
        <rect x="10.8" y="6.4" width="2.4" height="9.8" rx="1.1" fill={accent} />
        <rect x="15.4" y="9.2" width="2.4" height="7" rx="1.1" fill={ink} opacity="0.85" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M6.2 17.2V8.4c0-1.2.7-2 2.1-2.4L16.4 4.2v12.2"
        stroke={ink}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M6.2 17.2a2.1 2.1 0 1 0 4.2 0 2.1 2.1 0 0 0-4.2 0ZM16.4 16.4a2.1 2.1 0 1 0 4.2 0 2.1 2.1 0 0 0-4.2 0Z" fill={accent} />
    </svg>
  );
}

function CrystalPackIcon({ size }: { size: CrystalPackId }) {
  const count = size === "small" ? 1 : size === "medium" ? 2 : 3;
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      {Array.from({ length: count }, (_, index) => {
        const x = 5 + index * 6.2;
        const y = 8 - index * 1.2;
        return (
          <path
            key={index}
            d={`M${x + 4} ${y} L${x + 8} ${y + 5} L${x + 4} ${y + 10} L${x} ${y + 5}Z`}
            fill={index === count - 1 ? "var(--ui-warm)" : "var(--ui-ice)"}
            fillOpacity={0.55 + index * 0.2}
          />
        );
      })}
    </svg>
  );
}

function ShapePreview({ id, active }: { id: CrystalShapeId; active: boolean }) {
  const fill = active ? "var(--ui-ice)" : "#64748b";
  if (id === "hex") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path d="M9 1.5 15.5 5v8L9 16.5 2.5 13V5Z" fill={fill} fillOpacity="0.9" />
      </svg>
    );
  }
  if (id === "star") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path
          d="M9 1.8 10.8 6.6 15.8 7 12 10.4 13.2 15.4 9 12.8 4.8 15.4 6 10.4 2.2 7 7.2 6.6Z"
          fill={fill}
        />
      </svg>
    );
  }
  if (id === "rune") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path d="M9 2.2 15 14.5H3Z" fill={fill} />
      </svg>
    );
  }
  if (id === "ring") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <circle cx="9" cy="9" r="6.2" fill="none" stroke={fill} strokeWidth="2" />
        <circle cx="9" cy="9" r="2.2" fill={fill} />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M9 2 15.5 9 9 16 2.5 9Z" fill={fill} />
    </svg>
  );
}

function SettingsScreen({
  t,
  save,
  theme,
  systemLocale,
  confirmReset,
  onBack,
  onToggleMuted,
  onToggleHaptics,
  onLocale,
  onDuel,
  onTutorial,
  onReset,
}: {
  t: TranslateFn;
  save: GameSave;
  theme: VisualTheme;
  systemLocale: ReturnType<typeof resolveLocale>;
  confirmReset: boolean;
  onBack: () => void;
  onToggleMuted: () => void;
  onToggleHaptics: () => void;
  onLocale: (next: LocalePreference) => void;
  onDuel: () => void;
  onTutorial: () => void;
  onReset: () => void;
}) {
  const [langOpen, setLangOpen] = useState(false);
  const languageDetail =
    save.locale === "auto"
      ? t("language_auto", { name: localeNativeName(systemLocale) })
      : localeNativeName(save.locale);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader
        title={t("settings")}
        kicker={t("settings_kicker")}
        backLabel={t("back_menu")}
        onBack={onBack}
      />
      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-4">
        <SettingRow
          label={t("sound")}
          detail={save.muted ? t("sound_off") : t("sound_on")}
          pressed={!save.muted}
          accent={theme.warm}
          onClick={onToggleMuted}
        />
        <SettingRow
          label={t("haptics")}
          detail={save.haptics ? t("haptics_on") : t("haptics_off")}
          pressed={save.haptics}
          accent={theme.warm}
          onClick={onToggleHaptics}
        />
        <div className="ui-panel overflow-hidden rounded-[1.15rem] border backdrop-blur-md">
          <button
            type="button"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((open) => !open)}
            className="flex h-[4.75rem] w-full items-center justify-between px-4 text-left"
          >
            <span>
              <span className="block text-[17px] font-normal">{t("language")}</span>
              <span className="ui-muted mt-1 block text-[13px]">{languageDetail}</span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              aria-hidden
              className={`ui-muted shrink-0 transition-transform ${langOpen ? "rotate-180" : ""}`}
            >
              <path
                d="M3 5.2 7 9.2 11 5.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {langOpen && (
            <div className="border-t border-white/10 px-2 pb-2 pt-1" role="listbox" aria-label={t("language")}>
              <LanguageOption
                label={t("language_system")}
                detail={t("language_auto", { name: localeNativeName(systemLocale) })}
                selected={save.locale === "auto"}
                accent={theme.warm}
                onClick={() => {
                  onLocale("auto");
                  setLangOpen(false);
                }}
              />
              {LOCALE_OPTIONS.map((option) => (
                <LanguageOption
                  key={option.id}
                  label={option.native}
                  detail={option.id.toUpperCase()}
                  selected={save.locale === option.id}
                  accent={theme.warm}
                  onClick={() => {
                    onLocale(option.id);
                    setLangOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <SettingRow label={t("duel")} detail={t("duel_settings_detail")} onClick={onDuel} />
        <SettingRow label={t("learn")} detail={t("tutorial_again")} onClick={onTutorial} />
        <SettingRow
          label={confirmReset ? t("reset_confirm") : t("reset_progress")}
          detail={confirmReset ? t("reset_confirm_detail") : t("reset_detail")}
          danger
          onClick={onReset}
        />
      </div>
    </div>
  );
}

function LanguageOption({
  label,
  detail,
  selected,
  accent,
  onClick,
}: {
  label: string;
  detail: string;
  selected: boolean;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`mt-1 flex min-h-[3.35rem] w-full items-center justify-between rounded-[0.95rem] px-3 text-left ${
        selected ? "ui-panel-active" : "active:bg-white/5"
      }`}
    >
      <span>
        <span className="block text-[15px] font-normal">{label}</span>
        <span className="ui-muted mt-0.5 block text-[12px]">{detail}</span>
      </span>
      {selected && (
        <span
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
          style={{ background: accent }}
          aria-hidden
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5.2 4.1 7.2 8 2.8"
              stroke="#09090b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  );
}

function ScreenHeader({
  title,
  kicker,
  backLabel = "Back",
  onBack,
}: {
  title: string;
  kicker: string;
  backLabel?: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="ui-chip grid h-12 w-12 shrink-0 place-items-center rounded-full border bg-black/40 backdrop-blur-md"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
          <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div>
        <p className="ui-muted text-[11px] uppercase tracking-[0.28em]">{kicker}</p>
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
      className="ui-panel flex h-[4.5rem] items-center gap-3 rounded-[1.2rem] border px-3 text-left backdrop-blur-md active:scale-[0.98]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/30">{children}</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium leading-none">{label}</span>
        <span className="ui-muted mt-1.5 block text-[11px]">{detail}</span>
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
      className="ui-panel flex h-[4.6rem] flex-col items-center justify-center gap-1.5 rounded-[1.15rem] border backdrop-blur-md active:scale-[0.98]"
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
  accent,
}: {
  label: string;
  detail: string;
  onClick: () => void;
  pressed?: boolean;
  danger?: boolean;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="ui-panel flex h-[4.75rem] items-center justify-between rounded-[1.15rem] border px-4 text-left backdrop-blur-md"
    >
      <span>
        <span className={`block text-[17px] font-normal ${danger ? "text-[#fecaca]" : ""}`}>{label}</span>
        <span className="ui-muted mt-1 block text-[13px]">{detail}</span>
      </span>
      {pressed !== undefined && (
        <span
          className="h-8 w-[3.25rem] rounded-full p-1"
          style={{ background: pressed ? (accent ?? "var(--ui-warm)") : "rgba(255,255,255,0.15)" }}
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

function PlayCrystal({ accent, ink }: { accent: string; ink: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M13 1.8 23.2 13 13 24.2 2.8 13Z" fill={ink} fillOpacity="0.12" stroke={ink} strokeWidth="1.4" />
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

function LearnIcon({ accent = "var(--ui-warm)" }: { accent?: string }) {
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
      <circle cx="6.2" cy="14.6" r="1.5" fill={accent} />
    </svg>
  );
}

function ShopIcon({ accent = "var(--ui-warm)" }: { accent?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <path
        d="M5.2 8.2h11.6l-0.8 8.2H6L5.2 8.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8 8.2V6.4a3 3 0 0 1 6 0v1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 11.2 12.4 14.6 11 13.4 9.6 14.6Z" fill={accent} />
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

function StreakFlame({ accent }: { accent: string }) {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" fill="none">
      <path
        d="M7 1.2c1.2 2.1-.2 3.4-.2 5.1 0 1 .6 1.8 1.5 2.2-.2-2.4 2.4-3.1 2.4 1.1 0 2.7-2.1 4.6-4.7 4.6S1.3 12.3 1.3 9.6c0-2.6 1.8-3.8 2.6-5.4C4.6 3 5.4 2.1 7 1.2Z"
        fill={accent}
        fillOpacity="0.95"
      />
      <path
        d="M7 9.1c.55 0 1 .55 1 1.25S7.55 11.7 7 11.7s-1-.6-1-1.35.45-1.25 1-1.25Z"
        fill="currentColor"
        fillOpacity="0.35"
      />
    </svg>
  );
}

function DuelIcon({ accent = "var(--ui-warm)" }: { accent?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <path
        d="M5.2 16.2 10.4 5.4 15.8 16.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M7.2 12h6.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="16.5" cy="5.8" r="1.55" fill={accent} />
    </svg>
  );
}

function EventIcon({ large = false, accent = "var(--ui-warm)" }: { large?: boolean; accent?: string }) {
  const size = large ? 28 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" fill="none">
      <path
        d="M11 3.4 12.7 8.2 17.7 8.4 13.8 11.5 15.2 16.4 11 13.7 6.8 16.4 8.2 11.5 4.3 8.4 9.3 8.2Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="11" r="1.4" fill={accent} />
    </svg>
  );
}

function AlbumIcon({ count, accent = "var(--ui-warm)" }: { count: number; accent?: string }) {
  return (
    <span className="relative grid place-items-center">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M11 5.2 12.2 9.1 16.2 9.3 13.1 11.7 14.1 15.6 11 13.5 7.9 15.6 8.9 11.7 5.8 9.3 9.8 9.1Z"
          fill={accent}
          fillOpacity="0.9"
        />
      </svg>
      {count > 0 && (
        <span className="ui-accent absolute -right-1.5 -top-1 text-[9px] tabular-nums">{count}</span>
      )}
    </span>
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
