import type { VisualTheme } from "./themes";
import { CONSTELLATION_CRYSTAL_REWARD } from "./constellations";

/** Nagroda za obejrzenie (symulowanej) reklamy. */
export const AD_CRYSTAL_REWARD = 25;
/** Minimalny odstęp między reklamami (ms). */
export const AD_COOLDOWN_MS = 90_000;
/** Bonus za rozplątanie w limicie ruchów (par). */
export const PERFECT_MOVE_BONUS = 3;
/** Kryształy w trybie nieskończonym — co drugi poziom. */
export const ENDLESS_CRYSTAL_EVERY = 2;

/** Kryształy za pierwsze zaliczenie poziomu. */
export function crystalsForLevel(level: number): number {
  const safe = Math.max(1, Math.floor(level));
  if (safe <= 20) return 5;
  if (safe <= 40) return 10;
  if (safe <= 60) return 12 + Math.floor((safe - 41) / 10);
  // Nieskończone: wolniejszy dopływ.
  return safe % ENDLESS_CRYSTAL_EVERY === 0 ? 1 : 0;
}

/** Dodatkowy bonus za konstelację (nakłada się na bazę poziomu). */
export function constellationBonus(level: number): number {
  const safe = Math.max(1, Math.floor(level));
  if (safe % 5 !== 0 || safe > 60) return 0;
  return CONSTELLATION_CRYSTAL_REWARD;
}

/**
 * Cena wcześniejszego odblokowania motywu.
 * null = tylko postęp / darmowy (Zmierzch).
 */
export function themeCrystalPrice(theme: VisualTheme): number | null {
  if (theme.unlockAt <= 0 && theme.unlockEndless <= 0) return null;
  switch (theme.id) {
    case "garden":
      return 150;
    case "abyss":
      return 200;
    case "glacier":
      return 250;
    case "ember":
      return 400;
    case "aurora":
      return 500;
    case "nebula":
      return 800;
    case "gold":
      return 1000;
    default:
      return 30 + theme.unlockAt;
  }
}

export type SoundPackId = "harp" | "chimes" | "lute" | "glass";

export type SoundPack = {
  id: SoundPackId;
  name: string;
  detail: string;
  price: number;
};

export const SOUND_PACKS: readonly SoundPack[] = [
  { id: "harp", name: "Harfa", detail: "Domyślna · czysta lira", price: 0 },
  { id: "chimes", name: "Dzwonki", detail: "Tybetańskie misy", price: 300 },
  { id: "lute", name: "Lutnia", detail: "Ciepła struna akustyczna", price: 350 },
  { id: "glass", name: "Szkło", detail: "Ksylofon kryształowy", price: 350 },
];

export const TRAIL_PRICE = 200;

export type CrystalPackId = "small" | "medium" | "large";

export type CrystalPack = {
  id: CrystalPackId;
  name: string;
  detail: string;
  crystals: number;
};

export const CRYSTAL_PACKS: readonly CrystalPack[] = [
  { id: "small", name: "Mała paczka", detail: "Szybki zastrzyk", crystals: 80 },
  {
    id: "medium",
    name: "Średnia paczka",
    detail: "Najczęściej wybierana",
    crystals: 250,
  },
  {
    id: "large",
    name: "Duża paczka",
    detail: "Zapas na sklep",
    crystals: 750,
  },
];

export function soundPackById(id: string | null | undefined): SoundPack {
  return SOUND_PACKS.find((pack) => pack.id === id) ?? SOUND_PACKS[0]!;
}

export type CrystalShapeId = "diamond" | "hex" | "star" | "rune" | "ring";

export type CrystalShape = {
  id: CrystalShapeId;
  name: string;
  detail: string;
  price: number;
};

export const CRYSTAL_SHAPES: readonly CrystalShape[] = [
  { id: "diamond", name: "Diament", detail: "Klasyczny kwadrat", price: 0 },
  { id: "hex", name: "Heksagon", detail: "Sześciokątna fasetka", price: 250 },
  { id: "star", name: "Gwiazda", detail: "Ostrze konstelacji", price: 300 },
  { id: "rune", name: "Runa", detail: "Mały znak magiczny", price: 300 },
  { id: "ring", name: "Pierścień", detail: "Pulsujący obręcz", price: 350 },
];

export function crystalShapeById(id: string | null | undefined): CrystalShape {
  return CRYSTAL_SHAPES.find((shape) => shape.id === id) ?? CRYSTAL_SHAPES[0]!;
}
