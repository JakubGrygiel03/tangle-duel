import { crystalsForLevel } from "@/lib/engine/economy";
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
};

const KEY = "tangle-duel-save";

/** Tymczasowo: pełna kampania + motywy, żeby dało się od razu testować. */
export const unlockedSave = (): GameSave => ({
  muted: false,
  haptics: true,
  tutorialSeen: true,
  level: CAMPAIGN_LEVELS,
  clearedCampaign: Array.from({ length: CAMPAIGN_LEVELS }, (_, index) => index + 1),
  endlessBest: 75,
  themeId: "dusk",
  crystals: 120,
  purchasedThemes: [],
  lastAdAt: 0,
  dailyClaimedOn: "",
});

export const defaultSave = (): GameSave => unlockedSave();

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
  // Na razie wymuszamy pełny odblokowany postęp (kampania + motywy).
  memory = { ...unlockedSave(), ...pickPrefs(loadSave()) };
  writeSave(memory);
}

function pickPrefs(
  save: GameSave,
): Pick<
  GameSave,
  "muted" | "haptics" | "themeId" | "crystals" | "purchasedThemes" | "lastAdAt" | "dailyClaimedOn"
> {
  const unlocked = computeUnlockedThemes(
    Array.from({ length: CAMPAIGN_LEVELS }, (_, index) => index + 1),
    75,
    save.purchasedThemes,
  );
  const themeId = unlocked.includes(save.themeId) ? save.themeId : "dusk";
  return {
    muted: save.muted,
    haptics: save.haptics,
    themeId,
    crystals: save.crystals,
    purchasedThemes: save.purchasedThemes,
    lastAdAt: save.lastAdAt,
    dailyClaimedOn: save.dailyClaimedOn,
  };
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

export function subscribeSave(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Pierwsze zaliczenie poziomu: postęp + kryształy. */
export function recordClearedLevel(current: GameSave, level: number): GameSave {
  if (level >= 1 && level <= CAMPAIGN_LEVELS) {
    if (current.clearedCampaign.includes(level)) return current;
    return {
      ...current,
      clearedCampaign: [...current.clearedCampaign, level].sort((a, b) => a - b),
      crystals: current.crystals + crystalsForLevel(level),
    };
  }
  if (level > CAMPAIGN_LEVELS) {
    if (level <= current.endlessBest) return current;
    return {
      ...current,
      endlessBest: level,
      crystals: current.crystals + crystalsForLevel(level),
    };
  }
  return current;
}
