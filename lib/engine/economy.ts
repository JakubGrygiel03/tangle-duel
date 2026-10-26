import type { VisualTheme } from "./themes";
import {
  CONSTELLATION_CRYSTAL_REWARD,
  isConstellationLevel,
} from "./constellations";
import { CAMPAIGN_LEVELS, MASTER_START_DIFFICULTY } from "./graph";

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
  if (safe <= 40) return 5;
  if (safe <= 80) return 10;
  if (safe <= 120) return 12 + Math.floor((safe - 81) / 15);
  if (safe <= CAMPAIGN_LEVELS) return 14 + Math.floor((safe - 121) / 15);
  // Nieskończone: wolniejszy dopływ.
  return safe % ENDLESS_CRYSTAL_EVERY === 0 ? 1 : 0;
}

/** Dodatkowy bonus za konstelację (nakłada się na bazę poziomu). */
export function constellationBonus(level: number): number {
  return isConstellationLevel(level) ? CONSTELLATION_CRYSTAL_REWARD : 0;
}

/** Kryształy za układ w trybie Mistrz (rosną z trudnością). */
export function crystalsForMasterClear(difficulty: number, perfect: boolean): number {
  const step = Math.max(0, Math.floor(difficulty) - MASTER_START_DIFFICULTY);
  const base = 4 + Math.floor(step / 3);
  return Math.min(18, base) + (perfect ? PERFECT_MOVE_BONUS : 0);
}

/** Kryształy za układ w trybie Echo. */
export function crystalsForEchoClear(round: number, perfect: boolean): number {
  const base = 3 + Math.floor(Math.max(0, Math.floor(round) - 1) / 4);
  return Math.min(12, base) + (perfect ? PERFECT_MOVE_BONUS : 0);
}

/** Kryształy na koniec biegu Błyskawicy. */
export function crystalsForRushRun(cleared: number): number {
  const safe = Math.max(0, Math.floor(cleared));
  return Math.min(40, safe * 2);
}

/**
 * Cena wcześniejszego odblokowania motywu.
 * null = tylko postęp / darmowy (Zmierzch).
 */
export function themeCrystalPrice(theme: VisualTheme): number | null {
  if (theme.unlockAt <= 0 && theme.unlockEndless <= 0) return null;
  // Rosnąco z trudnością odblokowania — późniejsze motywy wyraźnie droższe.
  switch (theme.id) {
    case "nebula":
      return 200;
    case "glacier":
      return 350;
    case "ember":
      return 500;
    case "garden":
      return 700;
    case "abyss":
      return 850;
    case "gold":
      return 1000;
    case "aurora":
      return 1200;
    default:
      return 30 + Math.max(theme.unlockAt, theme.unlockEndless);
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

/** @deprecated Użyj TRAIL_STYLES — zostawione dla starych odwołań. */
export const TRAIL_PRICE = 200;

export type TrailId = "dust" | "ember" | "comet" | "aurora" | "spark" | "ribbon";

export type TrailStyle = {
  id: TrailId;
  name: string;
  detail: string;
  price: number;
};

/** Efekty śladu za przeciąganym kryształem. */
export const TRAIL_STYLES: readonly TrailStyle[] = [
  { id: "dust", name: "Pył światła", detail: "Delikatne drobinki za kryształem", price: 200 },
  { id: "ember", name: "Żar", detail: "Ciepłe iskry bursztynu", price: 250 },
  { id: "comet", name: "Kometa", detail: "Długa smuga jak ogon komety", price: 300 },
  { id: "aurora", name: "Zorza", detail: "Miękka wstęga lodowego światła", price: 320 },
  { id: "spark", name: "Iskra", detail: "Ostre błyski przy każdym ruchu", price: 280 },
  { id: "ribbon", name: "Wstęga", detail: "Płynna linia za palcem", price: 350 },
];

export function trailStyleById(id: string | null | undefined): TrailStyle {
  return TRAIL_STYLES.find((style) => style.id === id) ?? TRAIL_STYLES[0]!;
}

export function isTrailId(id: string): id is TrailId {
  return TRAIL_STYLES.some((style) => style.id === id);
}

export type CrystalPackId = "small" | "medium" | "large";

export type CrystalPack = {
  id: CrystalPackId;
  name: string;
  detail: string;
  crystals: number;
};

export const CRYSTAL_PACKS: readonly CrystalPack[] = [
  { id: "small", name: "Mała paczka", detail: "Szybki zastrzyk", crystals: 250 },
  {
    id: "medium",
    name: "Średnia paczka",
    detail: "Najczęściej wybierana",
    crystals: 750,
  },
  {
    id: "large",
    name: "Duża paczka",
    detail: "Zapas na sklep",
    crystals: 2000,
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
