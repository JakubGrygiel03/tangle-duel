"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import {
  constellationForLevel,
  isConstellationLevel,
  type Constellation,
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

const ROMAN = ["I", "II", "III", "IV", "V"] as const;

/** Wysokość jednego przystanku — trochę luźniej, żeby szeroki slalom się czytał. */
const ROW_REM = 3.75;
const ROW_UNITS = 10;

/**
 * Szeroki slalom L↔P z bezpiecznym marginesem od krawędzi karty.
 * ~6 poziomów na półokrąg — wypełnia pustki, węzły nie ocierają o bok.
 */
function pathX(index: number): number {
  const i = index;
  const sweep = Math.sin(i * (Math.PI / 3.15));
  const drift = Math.sin(i * 0.19 + 0.85) * 0.2;
  const t = Math.max(-1, Math.min(1, sweep * 0.94 + drift));
  // 50 ± 34 → ok. 16%…84% — oddech od lewej/prawej, nadal wypełnia planszę.
  return 50 + t * 34;
}

function pathY(index: number): number {
  return index * ROW_UNITS + ROW_UNITS / 2;
}

/** Deterministyczny szum 0…1 z pary liczb (bez Math.random). */
function mapHash(a: number, b: number): number {
  let n = ((a * 73856093) ^ (b * 19349663)) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 2246822507) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 3266489909) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

type MapSketch = {
  id: string;
  solved: readonly { x: number; y: number }[];
  edges: readonly { a: number; b: number }[];
};

type GhostSpot = {
  key: string;
  sketch: MapSketch;
  lit: boolean;
  left: number;
  topRem: number;
  sizeRem: number;
  rotateDeg: number;
  opacity: number;
};

/** Minimalny odstęp środka obrazka od środka ścieżki (% szerokości karty). */
const PATH_CLEAR_PCT = 26;
/** Pas ozdób od krawędzi (%). */
const GHOST_EDGE_MIN = 9;
const GHOST_EDGE_MAX = 91;
/**
 * Odstęp między obrazkami w „jednostkach mapy” (Δwiersz + Δ% / 10).
 * Za blisko = nachodzenie; za daleko = dziury — wypełniamy do limitu.
 */
const GHOST_GAP_MIN = 2.8;
const GHOST_GAP_MAX = 4.6;

function e(a: number, b: number): { a: number; b: number } {
  return { a, b };
}

/** Wymyślone sylwetki tylko na mapę — nie są poziomami gry. */
const MAP_FANCY: readonly MapSketch[] = [
  {
    id: "crescent",
    solved: [
      { x: 0.15, y: -0.85 },
      { x: 0.7, y: -0.35 },
      { x: 0.75, y: 0.35 },
      { x: 0.15, y: 0.85 },
      { x: -0.15, y: 0.35 },
      { x: -0.1, y: -0.35 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 4), e(4, 5), e(5, 0)],
  },
  {
    id: "spiral",
    solved: [
      { x: 0, y: 0 },
      { x: 0.35, y: -0.15 },
      { x: 0.45, y: 0.35 },
      { x: -0.15, y: 0.55 },
      { x: -0.65, y: 0.05 },
      { x: -0.35, y: -0.55 },
      { x: 0.35, y: -0.75 },
      { x: 0.85, y: -0.15 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 4), e(4, 5), e(5, 6), e(6, 7)],
  },
  {
    id: "kite",
    solved: [
      { x: 0, y: -0.9 },
      { x: 0.55, y: 0 },
      { x: 0, y: 0.55 },
      { x: -0.55, y: 0 },
      { x: 0, y: 0.95 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 0), e(2, 4)],
  },
  {
    id: "leaf",
    solved: [
      { x: 0, y: -0.9 },
      { x: 0.55, y: -0.25 },
      { x: 0.35, y: 0.45 },
      { x: 0, y: 0.9 },
      { x: -0.35, y: 0.45 },
      { x: -0.55, y: -0.25 },
      { x: 0, y: 0.1 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 4), e(4, 5), e(5, 0), e(0, 6), e(6, 3)],
  },
  {
    id: "droplet",
    solved: [
      { x: 0, y: -0.9 },
      { x: 0.45, y: -0.15 },
      { x: 0.55, y: 0.4 },
      { x: 0, y: 0.85 },
      { x: -0.55, y: 0.4 },
      { x: -0.45, y: -0.15 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 4), e(4, 5), e(5, 0)],
  },
  {
    id: "mount",
    solved: [
      { x: -0.9, y: 0.55 },
      { x: -0.35, y: -0.35 },
      { x: 0, y: 0.15 },
      { x: 0.4, y: -0.75 },
      { x: 0.9, y: 0.55 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 4)],
  },
  {
    id: "orbit",
    solved: [
      { x: 0, y: -0.75 },
      { x: 0.7, y: -0.25 },
      { x: 0.55, y: 0.55 },
      { x: -0.55, y: 0.55 },
      { x: -0.7, y: -0.25 },
      { x: 0, y: 0 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 4), e(4, 0), e(0, 5), e(2, 5), e(4, 5)],
  },
  {
    id: "shard",
    solved: [
      { x: -0.2, y: -0.9 },
      { x: 0.55, y: -0.45 },
      { x: 0.25, y: 0.35 },
      { x: -0.55, y: 0.85 },
      { x: -0.7, y: -0.1 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 4), e(4, 0), e(0, 2)],
  },
  {
    id: "arch",
    solved: [
      { x: -0.75, y: 0.7 },
      { x: -0.75, y: -0.15 },
      { x: -0.25, y: -0.75 },
      { x: 0.25, y: -0.75 },
      { x: 0.75, y: -0.15 },
      { x: 0.75, y: 0.7 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 4), e(4, 5)],
  },
  {
    id: "bloom",
    solved: [
      { x: 0, y: 0 },
      { x: 0, y: -0.85 },
      { x: 0.75, y: -0.35 },
      { x: 0.55, y: 0.6 },
      { x: -0.55, y: 0.6 },
      { x: -0.75, y: -0.35 },
    ],
    edges: [e(0, 1), e(0, 2), e(0, 3), e(0, 4), e(0, 5), e(1, 2), e(2, 3), e(3, 4), e(4, 5), e(5, 1)],
  },
  {
    id: "hook",
    solved: [
      { x: -0.35, y: -0.9 },
      { x: 0.35, y: -0.9 },
      { x: 0.55, y: -0.2 },
      { x: 0.15, y: 0.35 },
      { x: 0.55, y: 0.75 },
      { x: -0.15, y: 0.9 },
      { x: -0.55, y: 0.35 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 4), e(4, 5), e(5, 6), e(6, 3)],
  },
  {
    id: "prism",
    solved: [
      { x: 0, y: -0.85 },
      { x: 0.75, y: 0.15 },
      { x: 0, y: 0.85 },
      { x: -0.75, y: 0.15 },
      { x: 0, y: 0.05 },
    ],
    edges: [e(0, 1), e(1, 2), e(2, 3), e(3, 0), e(0, 4), e(1, 4), e(2, 4), e(3, 4)],
  },
];

function sketchFromConstellation(figure: Constellation): MapSketch {
  return { id: figure.id, solved: figure.solved, edges: figure.edges };
}

function ghostMapDist(
  a: { index: number; left: number },
  b: { index: number; left: number },
): number {
  const dy = Math.abs(a.index - b.index);
  const dx = Math.abs(a.left - b.left) / 10;
  return Math.hypot(dy, dx);
}

/** Ścieżka + węzeł zajmują pas — obrazek musi być poza nim na kilku sąsiednich rzędach. */
function clearOfPath(leftPct: number, rowIndex: number, halfSizePct: number): boolean {
  const need = PATH_CLEAR_PCT + halfSizePct;
  for (let d = -2; d <= 2; d++) {
    const row = rowIndex + d * 0.5;
    if (row < 0) continue;
    if (Math.abs(leftPct - pathX(row)) < need) return false;
  }
  return true;
}

/**
 * Ozdoby tylko w pustych kieszeniach naprzeciw łuków ścieżki
 * (np. wys. 3 → lewa, 6 → prawa, 31 → prawa, 34 → lewa).
 * Sam start/koniec krainy zostawiamy wolny — czytelne węzły.
 */
function buildGhostSpots(
  levels: readonly number[],
  clearedSet: ReadonlySet<number>,
  seed: number,
): GhostSpot[] {
  const milestones: { index: number; sketch: MapSketch; lit: boolean }[] = [];
  for (let index = 0; index < levels.length; index++) {
    const figure = constellationForLevel(levels[index]!);
    if (figure) {
      milestones.push({
        index,
        sketch: sketchFromConstellation(figure),
        lit: clearedSet.has(figure.level),
      });
    }
  }

  const last = levels.length - 1;
  /** Oddech przy pierwszym i ostatnim węźle — bez ozdób na starcie „Tu jesteś”. */
  const tipPad = 2;
  const sizeTier = [5.4, 3.1, 4.4, 3.6, 5.8, 2.8, 4.0, 4.9, 3.3, 5.1] as const;

  type Candidate = { index: number; left: number; sizeRem: number; orderKey: number };
  const candidates: Candidate[] = [];

  /** Tylko strona przeciwna do ścieżki, gdy łuk jest wyraźny. */
  const pushPocket = (index: number, bias: number) => {
    if (index < tipPad || index > last - tipPad) return;
    const px = pathX(index);
    const lean = px - 50;
    if (Math.abs(lean) < 16) return;
    const side: "left" | "right" = lean >= 0 ? "left" : "right";
    const h = mapHash(seed + bias, index * 97 + bias);
    const sizeRem = sizeTier[(index + bias) % sizeTier.length]! + (h - 0.5) * 0.5;
    const halfSizePct = 4 + sizeRem * 1.1;
    const leftLo = GHOST_EDGE_MIN;
    const leftHi = px - PATH_CLEAR_PCT - halfSizePct;
    const rightLo = px + PATH_CLEAR_PCT + halfSizePct;
    const rightHi = GHOST_EDGE_MAX;
    let left: number | null = null;
    if (side === "left" && leftHi - leftLo >= 6) {
      const t = 0.2 + mapHash(seed + 3, index * 13 + bias) * 0.55;
      left = leftLo + (leftHi - leftLo) * t;
    } else if (side === "right" && rightHi - rightLo >= 6) {
      const t = 0.2 + mapHash(seed + 9, index * 17 + bias) * 0.55;
      left = rightLo + (rightHi - rightLo) * t;
    }
    if (left === null) return;
    if (!clearOfPath(left, index, halfSizePct)) return;
    candidates.push({
      index,
      left,
      sizeRem,
      orderKey: index * 10 + bias,
    });
  };

  // Szczyty łuków (lokalne maksima |lean|) + sąsiednie rzędy w tej samej kieszeni.
  for (let index = tipPad; index <= last - tipPad; index++) {
    const abs = Math.abs(pathX(index) - 50);
    const prev = Math.abs(pathX(index - 1) - 50);
    const next = Math.abs(pathX(index + 1) - 50);
    const isApex = abs >= 16 && abs + 0.2 >= prev && abs + 0.2 >= next;
    if (!isApex) continue;
    pushPocket(index, 0);
    pushPocket(index - 0.9, 1);
    pushPocket(index + 0.9, 2);
  }

  const placed: Candidate[] = [];
  const tryPlace = (cand: Candidate): boolean => {
    if (!clearOfPath(cand.left, cand.index, 4 + cand.sizeRem * 1.1)) return false;
    for (const other of placed) {
      if (ghostMapDist(cand, other) < GHOST_GAP_MIN) return false;
    }
    placed.push(cand);
    return true;
  };

  // Najpierw najgłębsze kieszenie.
  candidates.sort((a, b) => {
    const da = Math.abs(pathX(a.index) - 50);
    const db = Math.abs(pathX(b.index) - 50);
    return db - da || a.index - b.index;
  });
  for (const cand of candidates) tryPlace(cand);

  // Domknij dziury tylko między istniejącymi (bez wpychania w tip start/koniec).
  let guard = 0;
  while (guard++ < 40) {
    placed.sort((a, b) => a.index - b.index || a.left - b.left);
    let inserted = false;
    for (let i = 0; i < placed.length - 1; i++) {
      const a = placed[i]!;
      const b = placed[i + 1]!;
      if (ghostMapDist(a, b) <= GHOST_GAP_MAX) continue;
      const midIndex = (a.index + b.index) / 2;
      if (midIndex < tipPad || midIndex > last - tipPad) continue;
      const before = candidates.length;
      pushPocket(midIndex, 20 + guard);
      pushPocket(midIndex + 0.2, 30 + guard);
      const fresh = candidates.slice(before);
      for (const cand of fresh) {
        if (tryPlace(cand)) {
          inserted = true;
          break;
        }
      }
      if (inserted) break;
    }
    if (!inserted) break;
  }

  placed.sort((a, b) => a.index - b.index || a.left - b.left);

  return placed.map((spot, order) => {
    const near = milestones.find((item) => Math.abs(item.index - spot.index) <= 1.5);
    const useReal = Boolean(near) && order % 4 === 0;
    const sketch = useReal
      ? near!.sketch
      : MAP_FANCY[(order * 3 + seed) % MAP_FANCY.length]!;
    const lit = useReal ? near!.lit : false;
    const h1 = mapHash(seed, spot.orderKey * 19);
    const h3 = mapHash(seed + 37, order * 11 + sketch.id.length * 9);
    const towardPath = spot.left < pathX(spot.index) ? 1 : -1;
    const rotateDeg = towardPath * (8 + h3 * 14) + (h1 - 0.5) * 10;

    return {
      key: `ghost-${spot.left.toFixed(1)}-${spot.index.toFixed(2)}-${sketch.id}`,
      sketch,
      lit,
      left: spot.left,
      topRem: spot.index * ROW_REM + ROW_REM / 2 + (h1 - 0.5) * 0.5,
      sizeRem: spot.sizeRem,
      rotateDeg,
      opacity: lit ? 0.48 : useReal ? 0.18 : 0.13 + h1 * 0.07,
    };
  });
}

/** Catmull-Rom z miękkim napięciem — okrągłe łuki, bez ostrych zakrętów. */
function smoothPath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const first = points[0]!;
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    // /4.5 zamiast /6 → dłuższe, łagodniejsze uchwyty Béziera
    const c1x = p1.x + (p2.x - p0.x) / 4.5;
    const c1y = p1.y + (p2.y - p0.y) / 4.5;
    const c2x = p2.x - (p3.x - p1.x) / 4.5;
    const c2y = p2.y - (p3.y - p1.y) / 4.5;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function continueTarget(current: number, cleared: readonly number[]): number {
  const peak = cleared.length > 0 ? Math.max(...cleared) : 0;
  const next = Math.min(CAMPAIGN_LEVELS, Math.max(1, peak + 1));
  if (
    current >= 1 &&
    current <= CAMPAIGN_LEVELS &&
    (current === 1 || cleared.includes(current) || current === peak + 1)
  ) {
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
        scroller.scrollTop + (nodeRect.top - scrollerRect.top) - scroller.clientHeight * 0.38;
      scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 80);
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

      <div ref={scrollRef} className="mt-3.5 min-h-0 flex-1 overflow-y-auto pb-2">
        <div className="flex flex-col gap-4">
          {REALMS.map((realm, index) => (
            <RealmSection
              key={realm.id}
              realm={realm}
              chapter={index}
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
            className={`flex h-[4.2rem] flex-col items-center justify-center rounded-[1.25rem] border backdrop-blur-md ${
              endlessOpen ? "ui-panel-soft active:scale-[0.98]" : "ui-panel-locked opacity-45"
            }`}
          >
            <span className="text-[1.1rem] font-light">{t("endless")}</span>
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

      <button
        type="button"
        onClick={() => onPick(resume)}
        className="play-seal mt-2.5 flex h-[3.55rem] w-full items-center justify-center gap-3 rounded-[1.2rem] active:scale-[0.98]"
      >
        <span className="text-[15px] font-medium">{t("map_continue")}</span>
        <span className="tabular-nums text-[1.25rem] font-light opacity-80">
          {t("level_word")} {resume}
        </span>
      </button>
    </div>
  );
}

function RealmSection({
  realm,
  chapter,
  t,
  cleared,
  current,
  resume,
  focused,
  focusRef,
  onPick,
}: {
  realm: CampaignRealm;
  chapter: number;
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
  const levels = useMemo(() => levelsInRealm(realm), [realm]);
  const clearedSet = useMemo(() => new Set(cleared), [cleared]);
  const peakCleared = useMemo(
    () => (cleared.length > 0 ? Math.max(...cleared) : 0),
    [cleared],
  );
  const [userToggle, setUserToggle] = useState<boolean | null>(null);
  // Domyślnie tylko aktywna kraina — reszta zwinięta, mniej DOM przy starcie.
  const expanded = userToggle ?? focused;

  const points = useMemo(
    () => levels.map((_, index) => ({ x: pathX(index), y: pathY(index) })),
    [levels],
  );
  const fullPath = useMemo(() => smoothPath(points), [points]);
  const reachedIndex = useMemo(() => {
    let last = -1;
    for (let index = 0; index < levels.length; index++) {
      const level = levels[index]!;
      if (clearedSet.has(level) || level === resume) last = index;
    }
    return last;
  }, [levels, clearedSet, resume]);
  const litPath = useMemo(
    () => (reachedIndex > 0 ? smoothPath(points.slice(0, reachedIndex + 1)) : ""),
    [points, reachedIndex],
  );
  const ghostSpots = useMemo(
    () => buildGhostSpots(levels, clearedSet, chapter + 1),
    [levels, clearedSet, chapter],
  );

  const stage: CSSProperties = {
    background: `
      radial-gradient(90% 40% at 50% 0%, ${theme.sky.a} 0%, transparent 70%),
      radial-gradient(70% 35% at 10% 80%, ${theme.sky.b} 0%, transparent 65%),
      linear-gradient(180deg, ${theme.ink}ee 0%, ${theme.ink}cc 100%)
    `,
    borderColor: `${theme.ice}28`,
    boxShadow: unlocked
      ? `inset 0 1px 0 ${theme.ice}14, 0 16px 36px rgba(0,0,0,0.32)`
      : undefined,
    contentVisibility: expanded ? "visible" : "auto",
    containIntrinsicSize: expanded ? undefined : "0 5.5rem",
  };

  return (
    <section
      className={`relative overflow-hidden rounded-[1.45rem] border ${unlocked ? "" : "opacity-50"}`}
      style={stage}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <button
        type="button"
        onClick={() => {
          if (unlocked) setUserToggle(!expanded);
        }}
        disabled={!unlocked}
        aria-expanded={unlocked ? expanded : false}
        className="relative z-[2] flex w-full items-center gap-3 px-3.5 pb-2.5 pt-3.5 text-left"
      >
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border text-[0.95rem] font-light tracking-[0.04em]"
          style={{
            borderColor: `${theme.warm}66`,
            background: `linear-gradient(145deg, ${theme.warm}33, ${theme.ink}aa)`,
            color: theme.warm,
            boxShadow: `0 0 16px ${theme.warm}28`,
          }}
        >
          {ROMAN[chapter] ?? chapter + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="block text-[10px] uppercase tracking-[0.24em]"
            style={{ color: `${theme.ice}88` }}
          >
            {t("map_chapter", { n: chapter + 1 })} · {realm.from}–{realm.to}
          </span>
          <span
            className="mt-1 block text-[1.28rem] font-light leading-none tracking-[-0.02em]"
            style={{ color: theme.ice }}
          >
            {t(REALM_TITLE[realm.id])}
          </span>
        </span>
        <span className="shrink-0 text-right">
          {unlocked ? (
            <span className="block text-[12px] tabular-nums" style={{ color: theme.ice }}>
              {progress.done}/{progress.total}
            </span>
          ) : (
            <span className="ui-muted block max-w-[5.5rem] text-[10px] leading-snug">
              {t("map_realm_locked", { n: realm.from })}
            </span>
          )}
          <span className="mt-1.5 ml-auto block h-1 w-14 overflow-hidden rounded-full bg-black/45">
            <span
              className="block h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${unlocked ? (progress.done / progress.total) * 100 : 0}%`,
                background: `linear-gradient(90deg, ${theme.warm}, ${theme.ice})`,
              }}
            />
          </span>
        </span>
        {unlocked ? (
          <span className="ui-muted ml-1 shrink-0 text-[11px]">{expanded ? "▴" : "▾"}</span>
        ) : null}
      </button>

      {expanded && unlocked ? (
        <div
          className="relative w-full px-3 pb-4 pt-1"
          style={{ minHeight: `${levels.length * ROW_REM}rem` }}
        >
          <FloorPattern theme={theme} />
          <MapAtmosphere theme={theme} seed={chapter + 1} />
          <StarField theme={theme} seed={chapter + 1} />

          {ghostSpots.map((spot) => (
            <FigureGhost
              key={spot.key}
              sketch={spot.sketch}
              theme={theme}
              lit={spot.lit}
              sizeRem={spot.sizeRem}
              rotateDeg={spot.rotateDeg}
              opacity={spot.opacity}
              style={{
                left: `${spot.left}%`,
                top: `${spot.topRem}rem`,
              }}
            />
          ))}

          <svg
            className="pointer-events-none absolute inset-x-0 top-0 w-full"
            style={{ height: `${levels.length * ROW_REM}rem` }}
            viewBox={`0 0 100 ${levels.length * ROW_UNITS}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={fullPath}
              fill="none"
              stroke="rgba(0,0,0,0.55)"
              strokeWidth="12"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="map-path-flow"
              d={fullPath}
              fill="none"
              stroke={theme.ice}
              strokeOpacity="0.2"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 10"
              vectorEffect="non-scaling-stroke"
            />
            {litPath ? (
              <path
                className="map-path-glow"
                d={litPath}
                fill="none"
                stroke={theme.warm}
                strokeWidth="3.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </svg>

          {levels.map((level, index) => {
            const clearedLevel = clearedSet.has(level);
            const open =
              level >= 1 &&
              level <= CAMPAIGN_LEVELS &&
              (level === 1 || clearedLevel || level === peakCleared + 1);
            const active = level === resume;
            const star = isConstellationLevel(level);
            const figure = star ? constellationForLevel(level) : null;

            return (
              <button
                key={level}
                type="button"
                disabled={!open}
                ref={(node) => {
                  if (active) focusRef.current = node;
                }}
                onClick={() => {
                  if (open) onPick(level);
                }}
                className={`absolute z-[3] -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:outline-none ${
                  open ? "active:scale-[0.94]" : "cursor-default"
                }`}
                style={{
                  left: `${pathX(index)}%`,
                  top: `${index * ROW_REM + ROW_REM / 2}rem`,
                }}
                aria-label={
                  figure
                    ? `${t("level_word")} ${level} · ${figure.name}`
                    : `${t("level_word")} ${level}`
                }
              >
                {active ? (
                  <span
                    className="pointer-events-none absolute left-1/2 top-[calc(100%+0.55rem)] z-[4] -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]"
                    style={{
                      background: theme.warm,
                      color: theme.ink,
                      boxShadow: `0 8px 18px ${theme.warm}66`,
                    }}
                  >
                    <span
                      className="absolute bottom-full left-1/2 -translate-x-1/2 border-x-[5px] border-b-[6px] border-x-transparent"
                      style={{ borderBottomColor: theme.warm }}
                    />
                    {t("map_here")}
                  </span>
                ) : null}
                {active ? (
                  <span
                    className="map-pulse pointer-events-none absolute inset-[-10px] rounded-full border-2"
                    style={{ borderColor: `${theme.warm}cc` }}
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={`relative grid place-items-center rounded-full ${
                    star ? "h-[3.15rem] w-[3.15rem]" : "h-[2.7rem] w-[2.7rem]"
                  }`}
                  style={nodeStyle(theme, { open, clearedLevel, active, star })}
                >
                  <span
                    className={`relative z-[1] tabular-nums font-semibold leading-none ${
                      star ? "text-[1rem]" : "text-[0.9rem]"
                    }`}
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {level}
                  </span>
                  {star ? (
                    <span
                      className="absolute -top-0.5 left-1/2 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full text-[8px] leading-none"
                      style={{
                        background: theme.warm,
                        color: theme.ink,
                        boxShadow: `0 0 8px ${theme.warm}88`,
                      }}
                    >
                      ✦
                    </span>
                  ) : null}
                  {clearedLevel && !active ? (
                    <span
                      className="absolute -bottom-0.5 left-1/2 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full"
                      style={{
                        background: theme.ice,
                        color: theme.ink,
                        boxShadow: `0 0 0 1px ${theme.ink}88`,
                      }}
                    >
                      <CheckMark />
                    </span>
                  ) : null}
                </span>
                {figure && open ? (
                  <span
                    className="pointer-events-none absolute left-1/2 top-[calc(100%+0.35rem)] w-max max-w-[5.5rem] -translate-x-1/2 truncate rounded-full px-1.5 py-0.5 text-center text-[9px] leading-none"
                    style={{
                      color: theme.ice,
                      background: `${theme.ink}cc`,
                      border: `1px solid ${theme.ice}33`,
                    }}
                  >
                    {figure.name}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function nodeStyle(
  theme: VisualTheme,
  state: { open: boolean; clearedLevel: boolean; active: boolean; star: boolean },
): CSSProperties {
  const baseShadow = "0 10px 0 -2px rgba(0,0,0,0.35), 0 12px 22px rgba(0,0,0,0.35)";
  if (state.active) {
    return {
      background: `radial-gradient(circle at 32% 28%, #fff 0%, ${theme.ice} 28%, ${theme.warm} 78%)`,
      border: `2.5px solid ${theme.ice}`,
      // Tylko okrągła poświata — bez „ramki” 0 0 0 Npx, która na buttonie wyglądała jak kwadrat.
      boxShadow: `0 0 22px ${theme.warm}99, 0 0 40px ${theme.warm}44, ${baseShadow}`,
      color: theme.ink,
    };
  }
  if (state.clearedLevel) {
    return {
      background: `radial-gradient(circle at 32% 28%, ${theme.warm}ee 0%, ${theme.warm} 55%, ${theme.warm}88 100%)`,
      border: `2px solid ${theme.warm}`,
      boxShadow: `0 0 16px ${theme.warm}40, ${baseShadow}`,
      color: theme.ink,
    };
  }
  if (state.open) {
    return {
      background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22) 0%, ${theme.ink}f2 62%)`,
      border: `2px solid ${theme.ice}77`,
      boxShadow: baseShadow,
      color: theme.ice,
    };
  }
  return {
    background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.06), ${theme.ink}e8)`,
    border: `2px solid ${state.star ? `${theme.warm}33` : "rgba(255,255,255,0.12)"}`,
    boxShadow: "0 6px 0 -2px rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.4)",
  };
}

/** Mgławice + pył — spokojny ruch jak w rozgrywce, bez JS w klatce. */
function MapAtmosphere({ theme, seed }: { theme: VisualTheme; seed: number }) {
  const blobs = useMemo(() => {
    const out: { left: number; top: number; size: number; delay: number; dur: number; warm: boolean }[] =
      [];
    let n = (seed * 2654435761) >>> 0;
    for (let i = 0; i < 5; i++) {
      n = (n * 1664525 + 1013904223) >>> 0;
      const left = 6 + (n % 780) / 10;
      n = (n * 1664525 + 1013904223) >>> 0;
      const top = 10 + (n % 820) / 10;
      n = (n * 1664525 + 1013904223) >>> 0;
      const size = 72 + (n % 90);
      n = (n * 1664525 + 1013904223) >>> 0;
      out.push({
        left,
        top,
        size,
        delay: (n % 50) / 10,
        dur: 9 + (n % 70) / 10,
        warm: i % 2 === 0,
      });
    }
    return out;
  }, [seed]);

  const motes = useMemo(() => {
    const out: { left: number; delay: number; dur: number; drift: number }[] = [];
    let n = (seed * 2246822519) >>> 0;
    for (let i = 0; i < 14; i++) {
      n = (n * 1664525 + 1013904223) >>> 0;
      const left = 8 + (n % 840) / 10;
      n = (n * 1664525 + 1013904223) >>> 0;
      out.push({
        left,
        delay: (n % 80) / 10,
        dur: 7 + (n % 60) / 10,
        drift: ((n % 40) - 20) / 10,
      });
    }
    return out;
  }, [seed]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {blobs.map((blob, index) => (
        <span
          key={`blob-${index}`}
          className="map-drift absolute rounded-full"
          style={{
            left: `${blob.left}%`,
            top: `${blob.top}%`,
            width: blob.size,
            height: blob.size,
            marginLeft: -blob.size / 2,
            marginTop: -blob.size / 2,
            background: blob.warm
              ? `radial-gradient(circle, ${theme.warm}33 0%, transparent 70%)`
              : `radial-gradient(circle, ${theme.ice}2e 0%, transparent 70%)`,
            animationDelay: `${blob.delay}s`,
            animationDuration: `${blob.dur}s`,
          }}
        />
      ))}
      {motes.map((mote, index) => (
        <span
          key={`mote-${index}`}
          className="map-float absolute bottom-[-4%] h-1 w-1 rounded-full"
          style={{
            left: `${mote.left}%`,
            background: index % 3 === 0 ? theme.warm : theme.ice,
            boxShadow: `0 0 6px ${index % 3 === 0 ? theme.warm : theme.ice}`,
            animationDelay: `${mote.delay}s`,
            animationDuration: `${mote.dur}s`,
            ["--map-drift-x" as string]: `${mote.drift}rem`,
          }}
        />
      ))}
    </div>
  );
}

/** Migające gwiazdy w tle krainy — czysty CSS, zero JS w klatce. */
function StarField({ theme, seed }: { theme: VisualTheme; seed: number }) {
  const stars = useMemo(() => {
    const out: { left: number; top: number; size: number; delay: number; dur: number }[] = [];
    let n = (seed * 1103515245 + 12345) >>> 0;
    for (let i = 0; i < 18; i++) {
      n = (n * 1664525 + 1013904223) >>> 0;
      const left = 6 + (n % 880) / 10;
      n = (n * 1664525 + 1013904223) >>> 0;
      const top = 6 + (n % 900) / 10;
      n = (n * 1664525 + 1013904223) >>> 0;
      const size = 1.1 + (n % 24) / 10;
      n = (n * 1664525 + 1013904223) >>> 0;
      const delay = (n % 40) / 10;
      n = (n * 1664525 + 1013904223) >>> 0;
      const dur = 2.4 + (n % 28) / 10;
      out.push({ left, top, size, delay, dur });
    }
    return out;
  }, [seed]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {stars.map((star, index) => (
        <span
          key={index}
          className="map-twinkle absolute rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            background: index % 3 === 0 ? theme.warm : theme.ice,
            boxShadow: `0 0 ${star.size * 2.2}px ${index % 3 === 0 ? theme.warm : theme.ice}`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Romby na podłodze — spójny „park” krainy. */
function FloorPattern({ theme }: { theme: VisualTheme }) {
  return (
    <svg
      className="map-floor pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={`floor-${theme.id}`} width="28" height="28" patternUnits="userSpaceOnUse">
          <path
            d="M14 0 L28 14 L14 28 L0 14 Z"
            fill="none"
            stroke={theme.ice}
            strokeWidth="0.7"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#floor-${theme.id})`} />
    </svg>
  );
}

function FigureGhost({
  sketch,
  theme,
  lit,
  sizeRem,
  rotateDeg,
  opacity,
  style,
}: {
  sketch: MapSketch;
  theme: VisualTheme;
  lit: boolean;
  sizeRem: number;
  rotateDeg: number;
  opacity: number;
  style: CSSProperties;
}) {
  const stroke = lit ? theme.warm : theme.ice;
  return (
    <svg
      className="pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-1/2"
      style={{
        ...style,
        width: `${sizeRem}rem`,
        height: `${sizeRem}rem`,
        opacity,
        transform: `translate(-50%, -50%) rotate(${rotateDeg.toFixed(1)}deg)`,
      }}
      viewBox="-1.15 -1.15 2.3 2.3"
      aria-hidden="true"
    >
      {sketch.edges.map((edge, index) => {
        const a = sketch.solved[edge.a];
        const b = sketch.solved[edge.b];
        if (!a || !b) return null;
        return (
          <line
            key={index}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={stroke}
            strokeWidth={0.05}
            strokeLinecap="round"
          />
        );
      })}
      {sketch.solved.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={0.055} fill={lit ? theme.ice : stroke} />
      ))}
    </svg>
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
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M2.2 5.2 4.2 7.2 7.8 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
