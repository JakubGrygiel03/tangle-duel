import {
  constellationBonus,
  crystalsForLevel,
  PERFECT_MOVE_BONUS,
  soundPackById,
  type SoundPackId,
} from "@/lib/engine/economy";
import {
  CONSTELLATIONS,
  type ConstellationId,
  constellationForLevel,
} from "@/lib/engine/constellations";
import { CAMPAIGN_LEVELS } from "@/lib/engine/graph";
import { computeUnlockedThemes, getTheme, type ThemeId } from "@/lib/engine/themes";

export type GameSave = {
  muted: boolean;
  haptics: boolean;
  tutorialSeen: boolean;
  /** Bieżący poziom (kampania 1–60 albo nieskończone 61+). */
  level: number;
  /** Zaliczone poziomy kampanii. */
  clearedCampaign: number[];
  /** Najwyższy zaliczony poziom w nieskończoności (0 = brak). */
  endlessBest: number;
  themeId: ThemeId;
  /** Miękka waluta sklepu. */
  crystals: number;
  /** Motywy kupione za kryształy (wcześniej niż z postępu). */
  purchasedThemes: ThemeId[];
  /** Ostatnia (symulowana) reklama — cooldown. */
  lastAdAt: number;
  /** Dzień (YYYY-MM-DD), za który odebrano nagrodę Daily. */
  dailyClaimedOn: string;
  /** Odkryte konstelacje (album). */
  constellations: ConstellationId[];
  /** Aktywny pakiet brzmienia. */
  soundPack: SoundPackId;
  /** Kupione pakiety (oprócz harfy). */
  purchasedSounds: SoundPackId[];
  /** Ślad światła za palcem. */
  trailOwned: boolean;
  trailEnabled: boolean;
};

const KEY = "tangle-duel-save";

export const defaultSave = (): GameSave => ({
  muted: false,
  haptics: true,
  tutorialSeen: false,
  level: 1,
  clearedCampaign: [],
  endlessBest: 0,
  themeId: "dusk",
  crystals: 0,
  purchasedThemes: [],
  lastAdAt: 0,
  dailyClaimedOn: "",
  constellations: [],
  soundPack: "harp",
  purchasedSounds: [],
  trailOwned: false,
  trailEnabled: false,
});

function sanitizeCampaign(levels: unknown): number[] {
  if (!Array.isArray(levels)) return [];
  const unique = new Set<number>();
  for (const level of levels) {
    if (Number.isInteger(level) && level >= 1 && level <= CAMPAIGN_LEVELS) unique.add(level);
  }
  return [...unique].sort((a, b) => a - b);
}

function sanitizePurchased(ids: unknown): ThemeId[] {
  if (!Array.isArray(ids)) return [];
  const unique = new Set<ThemeId>();
  for (const id of ids) {
    if (typeof id === "string" && getTheme(id).id === id) unique.add(id as ThemeId);
  }
  return [...unique];
}

function sanitizeConstellations(ids: unknown): ConstellationId[] {
  if (!Array.isArray(ids)) return [];
  const known = new Set(CONSTELLATIONS.map((item) => item.id));
  const unique = new Set<ConstellationId>();
  for (const id of ids) {
    if (typeof id === "string" && known.has(id as ConstellationId)) {
      unique.add(id as ConstellationId);
    }
  }
  return [...unique];
}

function sanitizeSounds(ids: unknown): SoundPackId[] {
  if (!Array.isArray(ids)) return [];
  const unique = new Set<SoundPackId>();
  for (const id of ids) {
    if (typeof id === "string" && soundPackById(id).id === id && id !== "harp") {
      unique.add(id as SoundPackId);
    }
  }
  return [...unique];
}

function sanitizeLevel(value: unknown, clearedCampaign: number[], endlessBest: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    if (endlessBest > 0) return Math.max(CAMPAIGN_LEVELS + 1, endlessBest);
    const peak = clearedCampaign.length > 0 ? Math.max(...clearedCampaign) : 0;
    return Math.min(CAMPAIGN_LEVELS, Math.max(1, peak + 1));
  }
  return Math.max(1, Math.floor(value));
}

export function loadSave(): GameSave {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<GameSave> & { cleared?: number[] };

    const fromLegacy = Array.isArray(parsed.cleared)
      ? parsed.cleared.filter((level) => Number.isInteger(level) && level >= 1 && level <= CAMPAIGN_LEVELS)
      : [];
    const clearedCampaign = sanitizeCampaign(parsed.clearedCampaign ?? fromLegacy);
    const endlessBest =
      typeof parsed.endlessBest === "number" && Number.isFinite(parsed.endlessBest)
        ? Math.max(0, Math.floor(parsed.endlessBest))
        : 0;
    const purchasedThemes = sanitizePurchased(parsed.purchasedThemes);
    const constellations = sanitizeConstellations(parsed.constellations);
    const purchasedSounds = sanitizeSounds(parsed.purchasedSounds);
    const unlocked = computeUnlockedThemes(clearedCampaign, endlessBest, purchasedThemes);
    const themeId = getTheme(
      typeof parsed.themeId === "string" && unlocked.includes(parsed.themeId as ThemeId)
        ? parsed.themeId
        : "dusk",
    ).id;
    const crystals =
      typeof parsed.crystals === "number" && Number.isFinite(parsed.crystals)
        ? Math.max(0, Math.floor(parsed.crystals))
        : 0;
    const lastAdAt =
      typeof parsed.lastAdAt === "number" && Number.isFinite(parsed.lastAdAt)
        ? Math.max(0, parsed.lastAdAt)
        : 0;
    const dailyClaimedOn =
      typeof parsed.dailyClaimedOn === "string" ? parsed.dailyClaimedOn.slice(0, 10) : "";
    const soundPack = soundPackById(
      typeof parsed.soundPack === "string" ? parsed.soundPack : "harp",
    ).id;
    const ownedSound =
      soundPack === "harp" || purchasedSounds.includes(soundPack) ? soundPack : "harp";
    const trailOwned = parsed.trailOwned === true;
    const trailEnabled = trailOwned && parsed.trailEnabled !== false;

    return {
      muted: parsed.muted === true,
      haptics: parsed.haptics !== false,
      tutorialSeen: parsed.tutorialSeen === true,
      level: sanitizeLevel(parsed.level, clearedCampaign, endlessBest),
      clearedCampaign,
      endlessBest,
      themeId,
      crystals,
      purchasedThemes,
      lastAdAt,
      dailyClaimedOn,
      constellations,
      soundPack: ownedSound,
      purchasedSounds,
      trailOwned,
      trailEnabled,
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(save: GameSave): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Prywatny tryb przeglądarki może odmówić zapisu. Gra działa dalej.
  }
}

let memory: GameSave = defaultSave();
if (typeof window !== "undefined") {
  memory = loadSave();
}

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

const serverSave = defaultSave();

export function readSave(): GameSave {
  return memory;
}

export function readServerSave(): GameSave {
  return serverSave;
}

export function updateSave(recipe: (current: GameSave) => GameSave): void {
  memory = recipe(memory);
  writeSave(memory);
  emit();
}

/** Pełny reset postępu — czyści localStorage i wraca do poziomu 1. */
export function resetProgress(
  keep: Pick<GameSave, "muted" | "haptics"> & { tutorialSeen?: boolean } = {
    muted: false,
    haptics: true,
  },
): GameSave {
  const next: GameSave = {
    ...defaultSave(),
    muted: keep.muted,
    haptics: keep.haptics,
    tutorialSeen: keep.tutorialSeen ?? true,
  };
  memory = next;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignoruj — i tak nadpisujemy poniżej.
  }
  writeSave(next);
  emit();
  return next;
}

/** Poziom dostępny w kampanii: 1 albo bezpośrednio po najwyższym zaliczonym. */
export function isLevelPlayable(level: number, clearedCampaign: readonly number[]): boolean {
  if (level < 1 || level > CAMPAIGN_LEVELS) return false;
  if (level === 1) return true;
  if (clearedCampaign.includes(level)) return true;
  const peak = clearedCampaign.length > 0 ? Math.max(...clearedCampaign) : 0;
  return level === peak + 1;
}

export function subscribeSave(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type ClearReward = {
  crystals: number;
  constellation: ConstellationId | null;
  alreadyCleared: boolean;
};

/** Pierwsze zaliczenie poziomu: postęp + kryształy + album. */
export function recordClearedLevel(
  current: GameSave,
  level: number,
  opts?: { perfect?: boolean },
): { save: GameSave; reward: ClearReward } {
  const perfectBonus = opts?.perfect ? PERFECT_MOVE_BONUS : 0;
  const figure = constellationForLevel(level);

  if (level >= 1 && level <= CAMPAIGN_LEVELS) {
    if (current.clearedCampaign.includes(level)) {
      return {
        save: current,
        reward: { crystals: 0, constellation: null, alreadyCleared: true },
      };
    }
    const base = crystalsForLevel(level);
    const bonus = constellationBonus(level);
    const crystals = base + bonus + perfectBonus;
    const constellations =
      figure && !current.constellations.includes(figure.id)
        ? [...current.constellations, figure.id]
        : current.constellations;
    return {
      save: {
        ...current,
        clearedCampaign: [...current.clearedCampaign, level].sort((a, b) => a - b),
        crystals: current.crystals + crystals,
        constellations,
      },
      reward: {
        crystals,
        constellation: figure && !current.constellations.includes(figure.id) ? figure.id : null,
        alreadyCleared: false,
      },
    };
  }

  if (level > CAMPAIGN_LEVELS) {
    if (level <= current.endlessBest) {
      return {
        save: current,
        reward: { crystals: 0, constellation: null, alreadyCleared: true },
      };
    }
    const base = crystalsForLevel(level);
    const crystals = base + perfectBonus;
    return {
      save: {
        ...current,
        endlessBest: level,
        crystals: current.crystals + crystals,
      },
      reward: { crystals, constellation: null, alreadyCleared: false },
    };
  }

  return {
    save: current,
    reward: { crystals: 0, constellation: null, alreadyCleared: true },
  };
}
