import { CAMPAIGN_LEVELS } from "./graph";
import { getTheme, type ThemeId, type VisualTheme } from "./themes";

/**
 * Kampania jako ścieżka przez krainy (jak mapa zadań).
 * Każda kraina = motyw wizualny + ciągły zakres poziomów.
 */
export type RealmId = "dusk" | "nebula" | "glacier" | "ember" | "garden";

export type CampaignRealm = {
  id: RealmId;
  themeId: ThemeId;
  /** Pierwszy poziom krainy (włącznie). */
  from: number;
  /** Ostatni poziom krainy (włącznie). */
  to: number;
};

/** Pięć krain × 36 poziomów = kampania 1–180. */
export const REALMS: readonly CampaignRealm[] = [
  { id: "dusk", themeId: "dusk", from: 1, to: 36 },
  { id: "nebula", themeId: "nebula", from: 37, to: 72 },
  { id: "glacier", themeId: "glacier", from: 73, to: 108 },
  { id: "ember", themeId: "ember", from: 109, to: 144 },
  { id: "garden", themeId: "garden", from: 145, to: 180 },
] as const;

export function realmForLevel(level: number): CampaignRealm {
  const safe = Math.max(1, Math.floor(level));
  return (
    REALMS.find((realm) => safe >= realm.from && safe <= realm.to) ??
    REALMS[REALMS.length - 1]!
  );
}

export function realmTheme(realm: CampaignRealm): VisualTheme {
  return getTheme(realm.themeId);
}

/** Kraina otwarta, gdy gracz doszedł do jej progu (albo to pierwsza). */
export function isRealmUnlocked(
  realm: CampaignRealm,
  clearedCampaign: readonly number[],
  progressLevel: number,
): boolean {
  if (realm.from <= 1) return true;
  const peakCleared = clearedCampaign.length > 0 ? Math.max(...clearedCampaign) : 0;
  const reached = Math.max(peakCleared, Math.max(0, Math.floor(progressLevel) - 1));
  return reached >= realm.from - 1;
}

export function realmProgress(
  realm: CampaignRealm,
  clearedCampaign: readonly number[],
): { done: number; total: number } {
  const total = realm.to - realm.from + 1;
  let done = 0;
  for (const level of clearedCampaign) {
    if (level >= realm.from && level <= realm.to) done += 1;
  }
  return { done, total };
}

/** Poziomy w krainie — do ścieżki mapy. */
export function levelsInRealm(realm: CampaignRealm): number[] {
  const out: number[] = [];
  for (let level = realm.from; level <= Math.min(realm.to, CAMPAIGN_LEVELS); level++) {
    out.push(level);
  }
  return out;
}

/** Kraina, na której gracz powinien skupić uwagę. */
export function focusRealm(
  currentLevel: number,
  clearedCampaign: readonly number[],
): CampaignRealm {
  const peak = clearedCampaign.length > 0 ? Math.max(...clearedCampaign) : 0;
  const focus = Math.max(1, Math.min(CAMPAIGN_LEVELS, Math.max(currentLevel, peak + 1)));
  return realmForLevel(focus);
}
