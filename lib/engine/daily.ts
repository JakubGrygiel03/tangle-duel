import { isConstellationLevel } from "./constellations";
import { CAMPAIGN_LEVELS } from "./graph";

export type DailyChallenge = {
  /** Klucz dnia lokalnego YYYY-MM-DD. */
  day: string;
  /** Trudność generycznej łamigłówki (nie poziom figury kampanii). */
  level: number;
  seed: number;
  reward: number;
};

export function localDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Poprzedni dzień kalendarzowy względem klucza YYYY-MM-DD. */
export function previousDayKey(day: string): string {
  const [y, m, d] = day.split("-").map((part) => Number(part));
  const date = new Date(y!, m! - 1, d!);
  date.setDate(date.getDate() - 1);
  return localDayKey(date);
}

/**
 * Seria Daily: kontynuacja, jeśli wczoraj zaliczone; reset, jeśli przerwa.
 * Dzisiejsze ponowne zaliczenie nie zmienia serii.
 */
export function nextDailyStreak(
  claimedOn: string,
  currentStreak: number,
  today: string,
): number {
  const streak = Math.max(0, Math.floor(currentStreak));
  if (claimedOn === today) return Math.max(1, streak);
  if (claimedOn && claimedOn === previousDayKey(today)) return streak + 1;
  return 1;
}

/** Widoczna seria — 0, gdy wczoraj/dziś nie było zaliczenia. */
export function visibleDailyStreak(
  claimedOn: string,
  streak: number,
  today: string,
): number {
  const value = Math.max(0, Math.floor(streak));
  if (value <= 0 || !claimedOn) return 0;
  if (claimedOn === today) return value;
  if (claimedOn === previousDayKey(today)) return value;
  return 0;
}

function hashDay(day: string): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Trudność Daily w paśmie puzzle — omija numery figur albumu (co 6. poziom). */
function dailyPuzzleDifficulty(hash: number): number {
  const min = 14;
  const max = Math.min(46, CAMPAIGN_LEVELS);
  const span = max - min + 1;
  for (let i = 0; i < span; i++) {
    const level = min + ((hash + i) % span);
    if (!isConstellationLevel(level)) return level;
  }
  return 19;
}

/** Jeden układ na dzień — ten sam dla wszystkich w tej strefie czasowej. */
export function getDailyChallenge(date = new Date()): DailyChallenge {
  const day = localDayKey(date);
  const h = hashDay(day);
  const level = dailyPuzzleDifficulty(h);
  const seed = (h ^ Math.imul(level, 10007)) >>> 0;
  return {
    day,
    level,
    seed,
    reward: 40,
  };
}
