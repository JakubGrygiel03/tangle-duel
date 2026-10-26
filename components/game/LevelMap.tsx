"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import { isLevelPlayable } from "@/components/game/storage";
import {
  constellationForLevel,
  isConstellationLevel,
} from "@/lib/engine/constellations";
import { CAMPAIGN_LEVELS } from "@/lib/engine/graph";
import {
  REALMS,
  focusRealm,
  isRealmUnlocked,
  levelsInRealm,
  realmProgress,
  realmTheme,
  type CampaignRealm,
  type RealmId,
} from "@/lib/engine/realms";
import type { VisualTheme } from "@/lib/engine/themes";
import type { MessageKey } from "@/lib/i18n/messages";
import type { TranslateFn } from "@/lib/i18n";

type LevelMapProps = {
  t: TranslateFn;
  current: number;
  cleared: number[];
  endlessBest: number;
  endlessOpen: boolean;
  onBack: () => void;
  onPick: (level: number) => void;
  onEndless: () => void;
};

const REALM_TITLE: Record<RealmId, MessageKey> = {
  dusk: "realm_dusk",
  nebula: "realm_nebula",
  glacier: "realm_glacier",
  ember: "realm_ember",
  garden: "realm_garden",
};

const REALM_DETAIL: Record<RealmId, MessageKey> = {
  dusk: "realm_dusk_detail",
  nebula: "realm_nebula_detail",
  glacier: "realm_glacier_detail",
  ember: "realm_ember_detail",
  garden: "realm_garden_detail",
};

/** Zigzag lanes — procent od lewej krawędzi ścieżki. */
function pathLeftPercent(index: number): number {
  const phase = index % 4;
  if (phase === 0) return 50;
  if (phase === 1) return 78;
  if (phase === 2) return 50;
  return 22;
}

function continueTarget(current: number, cleared: readonly number[]): number {
  const peak = cleared.length > 0 ? Math.max(...cleared) : 0;
  const next = Math.min(CAMPAIGN_LEVELS, Math.max(1, peak + 1));
  if (current >= 1 && current <= CAMPAIGN_LEVELS && isLevelPlayable(current, cleared)) {
    return current;
  }
  return next;
}

export function LevelMap({
  t,
  current,
  cleared,
  endlessBest,
  endlessOpen,
  onBack,
  onPick,
  onEndless,
}: LevelMapProps) {
  const done = cleared.length;
  const resume = continueTarget(current, cleared);
  const focus = focusRealm(resume, cleared);
  const scrollRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const timer = window.setTimeout(() => {
      const node = focusRef.current;
      if (!node) return;
      const nodeRect = node.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const top =
        scroller.scrollTop + (nodeRect.top - scrollerRect.top) - scroller.clientHeight * 0.35;
      scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [resume, focus.id]);

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

      <button
        type="button"
        onClick={() => onPick(resume)}
        className="ui-panel-active mt-4 flex h-[3.6rem] w-full items-center justify-between rounded-[1.15rem] border px-4 backdrop-blur-md active:scale-[0.98]"
      >
        <span className="text-[15px] font-medium">{t("map_continue")}</span>
        <span className="tabular-nums text-[1.35rem] font-light">
          {t("level_word")} {resume}
        </span>
      </button>

      <div ref={scrollRef} className="mt-4 min-h-0 flex-1 overflow-y-auto pb-3">
        <div className="flex flex-col gap-6">
          {REALMS.map((realm) => (
            <RealmSection
              key={realm.id}
              realm={realm}
              t={t}
              cleared={cleared}
              current={current}
              resume={resume}
              focused={realm.id === focus.id}
              focusRef={focusRef}
              onPick={onPick}
            />
          ))}

          <button
            type="button"
            disabled={!endlessOpen}
            onClick={onEndless}
            className={`flex h-[4.4rem] flex-col items-center justify-center rounded-[1.15rem] border backdrop-blur-md ${
              endlessOpen ? "ui-panel-soft active:scale-[0.98]" : "ui-panel-locked opacity-45"
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
      </div>
    </div>
  );
}

function RealmSection({
  realm,
  t,
  cleared,
  current,
  resume,
  focused,
  focusRef,
  onPick,
}: {
  realm: CampaignRealm;
  t: TranslateFn;
  cleared: number[];
  current: number;
  resume: number;
  focused: boolean;
  focusRef: MutableRefObject<HTMLButtonElement | null>;
  onPick: (level: number) => void;
}) {
  const theme = realmTheme(realm);
  const unlocked = isRealmUnlocked(realm, cleared, current);
  const progress = realmProgress(realm, cleared);
  const complete = progress.done >= progress.total;
  const levels = useMemo(() => levelsInRealm(realm), [realm]);
  const [expanded, setExpanded] = useState(focused || (unlocked && !complete));

  useEffect(() => {
    if (focused) setExpanded(true);
  }, [focused]);

  const wash: CSSProperties = {
    background: `
      radial-gradient(110% 70% at 50% -10%, ${theme.sky.a} 0%, transparent 55%),
      radial-gradient(80% 50% at 12% 88%, ${theme.sky.b}88 0%, transparent 60%),
      radial-gradient(70% 45% at 92% 40%, ${theme.ember.a}55 0%, transparent 55%),
      linear-gradient(180deg, ${theme.ink}cc 0%, ${theme.ink}99 100%)
    `,
    borderColor: `${theme.ice}30`,
    boxShadow: unlocked ? `inset 0 1px 0 ${theme.ice}18, 0 18px 40px rgba(0,0,0,0.28)` : undefined,
  };

  return (
    <section
      className={`relative overflow-hidden rounded-[1.35rem] border px-2.5 pb-3 pt-3.5 ${
        unlocked ? "backdrop-blur-md" : "opacity-55"
      }`}
      style={wash}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <StarDust accent={theme.ice} />
      <button
        type="button"
        onClick={() => {
          if (unlocked) setExpanded((value) => !value);
        }}
        disabled={!unlocked}
        className="relative z-[1] flex w-full items-start justify-between gap-3 px-1.5 text-left"
        aria-expanded={unlocked ? expanded : false}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: theme.ice }}>
            {t("map_path")} · {realm.from}–{realm.to}
          </p>
          <h2 className="mt-1 text-[1.35rem] font-light leading-none tracking-[-0.02em]">
            {t(REALM_TITLE[realm.id])}
          </h2>
          <p className="ui-muted mt-1.5 text-[12px] leading-snug">{t(REALM_DETAIL[realm.id])}</p>
        </div>
        <div className="shrink-0 text-right">
          {unlocked ? (
            <p className="tabular-nums text-[13px]" style={{ color: theme.ice }}>
              {progress.done}/{progress.total}
            </p>
          ) : (
            <p className="ui-muted text-[11px] leading-snug">
              {t("map_realm_locked", { n: realm.from })}
            </p>
          )}
          <div className="mt-2 ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${unlocked ? (progress.done / progress.total) * 100 : 0}%`,
                background: `linear-gradient(90deg, ${theme.warm}, ${theme.ice})`,
                boxShadow: `0 0 10px ${theme.warm}88`,
              }}
            />
          </div>
          {unlocked ? (
            <p className="ui-muted mt-2 text-[10px] uppercase tracking-[0.18em]">
              {expanded ? "▴" : "▾"}
            </p>
          ) : null}
        </div>
      </button>

      {expanded && unlocked ? (
        <div className="relative z-[1] mx-auto mt-2.5 max-w-[22rem] px-1 pt-0.5">
          <PathTrail theme={theme} count={levels.length} />
          <ol className="relative z-[1] flex flex-col gap-1.5 py-0.5">
            {levels.map((level, index) => {
              const clearedLevel = cleared.includes(level);
              const open = isLevelPlayable(level, cleared);
              const active = level === resume;
              const star = isConstellationLevel(level);
              const figure = star ? constellationForLevel(level) : null;
              const left = pathLeftPercent(index);
              const showName = Boolean(star && figure && open);

              return (
                <li key={level} className="relative h-[2.95rem]">
                  <button
                    type="button"
                    disabled={!open}
                    ref={(node) => {
                      if (active) focusRef.current = node;
                    }}
                    onClick={() => {
                      if (open) onPick(level);
                    }}
                    className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 ${
                      open ? "active:scale-[0.96]" : "cursor-default"
                    }`}
                    style={{ left: `${left}%` }}
                    aria-label={
                      star && figure
                        ? `${t("level_word")} ${level} · ${figure.name}`
                        : `${t("level_word")} ${level}`
                    }
                  >
                    <span
                      className={`relative grid place-items-center rounded-full border backdrop-blur-md transition-shadow ${
                        star ? "h-[2.85rem] w-[2.85rem]" : "h-[2.45rem] w-[2.45rem]"
                      } ${!open ? "opacity-45" : ""}`}
                      style={nodeStyle(theme, { open, clearedLevel, active, star })}
                    >
                      <span
                        className={`font-medium tabular-nums leading-none ${
                          star ? "text-[0.95rem]" : "text-[0.88rem]"
                        }`}
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {level}
                      </span>
                      {star ? (
                        <span
                          className="absolute -right-0.5 -top-0.5 grid h-[0.95rem] w-[0.95rem] place-items-center rounded-full text-[8px] leading-none"
                          style={{
                            background: theme.ink,
                            color: theme.warm,
                            boxShadow: `0 0 0 1px ${theme.warm}99`,
                          }}
                        >
                          ✦
                        </span>
                      ) : null}
                      {clearedLevel ? (
                        <span
                          className="absolute -bottom-0.5 -left-0.5 grid h-[0.95rem] w-[0.95rem] place-items-center rounded-full"
                          style={{
                            background: theme.ink,
                            color: theme.ice,
                            boxShadow: `0 0 0 1px ${theme.free}88`,
                          }}
                        >
                          <CheckMark />
                        </span>
                      ) : null}
                    </span>
                    {showName && figure ? (
                      <span
                        className="pointer-events-none absolute left-1/2 top-[calc(100%+0.18rem)] z-[2] w-max max-w-[5.8rem] -translate-x-1/2 truncate rounded-full px-1.5 py-0.5 text-center text-[9px] leading-none"
                        style={{
                          color: theme.ice,
                          background: `${theme.ink}dd`,
                          border: `1px solid ${theme.ice}44`,
                        }}
                      >
                        {figure.name}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function nodeStyle(
  theme: VisualTheme,
  state: { open: boolean; clearedLevel: boolean; active: boolean; star: boolean },
): CSSProperties {
  if (state.active) {
    return {
      background: `linear-gradient(160deg, ${theme.warm}77, ${theme.ink}e0)`,
      borderColor: theme.warm,
      boxShadow: `0 0 0 3px ${theme.warm}33, 0 10px 26px ${theme.warm}55`,
      color: theme.ice,
    };
  }
  if (state.star && state.open) {
    return {
      background: `linear-gradient(160deg, ${theme.ice}40, ${theme.ink}e0)`,
      borderColor: `${theme.warm}88`,
      boxShadow: `0 0 16px ${theme.warm}40, 0 6px 18px ${theme.sky.a}`,
      color: theme.ice,
    };
  }
  if (state.clearedLevel) {
    return {
      background: `linear-gradient(160deg, ${theme.free}44, ${theme.ink}e0)`,
      borderColor: `${theme.free}77`,
      boxShadow: `0 4px 14px ${theme.free}30`,
      color: theme.ice,
    };
  }
  if (state.open) {
    return {
      background: `linear-gradient(160deg, rgba(255,255,255,0.14), ${theme.ink}d4)`,
      borderColor: `${theme.ice}55`,
      boxShadow: `0 5px 14px rgba(0,0,0,0.32)`,
      color: theme.ice,
    };
  }
  return {
    background: "rgba(0,0,0,0.38)",
    borderColor: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.48)",
  };
}

function PathTrail({ theme, count }: { theme: VisualTheme; count: number }) {
  if (count < 2) return null;
  const coords = Array.from({ length: count }, (_, index) => {
    const x = pathLeftPercent(index);
    const y = ((index + 0.5) / count) * 100;
    return { x, y };
  });
  const points = coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(2)}`).join(" ");

  return (
    <svg
      className="pointer-events-none absolute inset-x-0 inset-y-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={theme.ink}
        strokeOpacity="0.55"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={points}
        fill="none"
        stroke={theme.ice}
        strokeOpacity="0.28"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={points}
        fill="none"
        stroke={theme.warm}
        strokeOpacity="0.42"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2.5 6"
        vectorEffect="non-scaling-stroke"
      />
      {coords.map((point, index) =>
        index % 3 === 1 ? (
          <circle
            key={`bead-${index}`}
            cx={point.x}
            cy={point.y}
            r="0.55"
            fill={theme.warm}
            fillOpacity="0.55"
          />
        ) : null,
      )}
    </svg>
  );
}

function StarDust({ accent }: { accent: string }) {
  const sparks = [
    { left: "8%", top: "22%", size: 2, o: 0.35 },
    { left: "18%", top: "68%", size: 1.5, o: 0.28 },
    { left: "86%", top: "18%", size: 2, o: 0.32 },
    { left: "92%", top: "58%", size: 1.5, o: 0.25 },
    { left: "74%", top: "82%", size: 2, o: 0.3 },
    { left: "28%", top: "40%", size: 1, o: 0.22 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {sparks.map((spark, index) => (
        <span
          key={index}
          className="absolute rounded-full"
          style={{
            left: spark.left,
            top: spark.top,
            width: spark.size,
            height: spark.size,
            background: accent,
            opacity: spark.o,
            boxShadow: `0 0 6px ${accent}`,
          }}
        />
      ))}
    </div>
  );
}

function ScreenHeader({
  title,
  kicker,
  backLabel,
  onBack,
}: {
  title: string;
  kicker: string;
  backLabel: string;
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
        <p className="ui-muted text-[11px] uppercase tracking-[0.28em]">{kicker}</p>
        <h1 className="text-[2rem] font-light leading-none tracking-[-0.03em]">{title}</h1>
      </div>
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M2.2 5.2 4.2 7.2 7.8 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
