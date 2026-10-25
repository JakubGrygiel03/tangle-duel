import type { VisualTheme } from "./themes";

/** Nagroda za obejrzenie (symulowanej) reklamy. */
export const AD_CRYSTAL_REWARD = 25;
/** Minimalny odstęp między reklamami (ms). */
export const AD_COOLDOWN_MS = 90_000;

/** Kryształy za pierwsze zaliczenie poziomu (3–8). */
export function crystalsForLevel(level: number): number {
  const safe = Math.max(1, Math.floor(level));
  return Math.min(8, 3 + Math.floor((safe - 1) / 10));
}

/** Cena wcześniejszego odblokowania motywu; null = tylko z postępu / darmowy. */
export function themeCrystalPrice(theme: VisualTheme): number | null {
  if (theme.unlockAt <= 0 && theme.unlockEndless <= 0) return null;
  if (theme.unlockEndless > 0) return 150;
  return 30 + theme.unlockAt;
}
