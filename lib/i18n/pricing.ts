import type { CrystalPackId } from "@/lib/engine/economy";
import { resolveLocale, type LocaleId, type LocalePreference } from "./locales";

/**
 * Region cenowy paczek kryształów (proporcja small:medium:large = 1:2:4).
 * Wybór z preferencji języka + tagu regionu systemu (en-GB, es-MX, …).
 */
export type PriceRegion = "eur" | "usd" | "gbp" | "pln" | "rub" | "aud" | "cad" | "mxn";

const EUROZONE = new Set([
  "at",
  "be",
  "cy",
  "de",
  "ee",
  "es",
  "fi",
  "fr",
  "gr",
  "hr",
  "ie",
  "it",
  "lt",
  "lu",
  "lv",
  "mt",
  "nl",
  "pt",
  "si",
  "sk",
]);

/** LatAm hiszpański → dolary / peso, nie euro. */
const LATAM = new Set([
  "mx",
  "ar",
  "cl",
  "co",
  "pe",
  "ve",
  "ec",
  "uy",
  "py",
  "bo",
  "cr",
  "pa",
  "gt",
  "hn",
  "sv",
  "ni",
  "do",
  "cu",
  "pr",
]);

const PACK_LABELS: Record<PriceRegion, Record<CrystalPackId, string>> = {
  eur: { small: "1 €", medium: "2 €", large: "4 €" },
  usd: { small: "$1", medium: "$2", large: "$4" },
  gbp: { small: "£1", medium: "£2", large: "£4" },
  /** Polska — historyczne 2 / 5 / 10 zł (nie 1:2:4). */
  pln: { small: "2 zł", medium: "5 zł", large: "10 zł" },
  rub: { small: "100 ₽", medium: "200 ₽", large: "400 ₽" },
  aud: { small: "A$1.50", medium: "A$3", large: "A$6" },
  cad: { small: "C$1.50", medium: "C$3", large: "C$6" },
  mxn: { small: "MX$20", medium: "MX$40", large: "MX$80" },
};

/** Usuń reklamy + odblokuj cały katalog (motywy, kształty, brzmienia, ślad). */
const PREMIUM_LABELS: Record<PriceRegion, string> = {
  eur: "10 €",
  usd: "$10",
  gbp: "£9",
  pln: "20 zł",
  rub: "1000 ₽",
  aud: "A$15",
  cad: "C$14",
  mxn: "MX$200",
};

function systemTags(
  languages: readonly string[] = typeof navigator !== "undefined"
    ? [...(navigator.languages ?? []), navigator.language]
    : ["en"],
): { lang: string; region: string }[] {
  const out: { lang: string; region: string }[] = [];
  for (const raw of languages) {
    if (!raw) continue;
    const normalized = raw.trim().toLowerCase().replace("_", "-");
    const [lang = "", region = ""] = normalized.split("-");
    if (lang) out.push({ lang, region });
  }
  return out;
}

function regionFromTags(tags: { lang: string; region: string }[]): PriceRegion | null {
  for (const { lang, region } of tags) {
    if (!region) continue;
    if (region === "gb" || region === "uk") return "gbp";
    if (region === "au" || region === "nz") return "aud";
    if (region === "ca") return "cad";
    if (region === "mx") return "mxn";
    if (region === "us") return "usd";
    if (region === "pl") return "pln";
    if (region === "ru") return "rub";
    if (EUROZONE.has(region)) return "eur";
    if (LATAM.has(region)) return region === "mx" ? "mxn" : "usd";
    if (lang === "en" && region) return "usd";
  }
  return null;
}

/**
 * Region cenowy: najpierw tag regionu systemu (en-US, de-DE…),
 * potem mapowanie z wybranego / wykrytego języka UI.
 */
export function resolvePriceRegion(
  preference: LocalePreference | null | undefined,
  languages?: readonly string[],
): PriceRegion {
  const tags = systemTags(languages);
  const fromRegion = regionFromTags(tags);
  const locale: LocaleId = resolveLocale(preference);

  // Przy „auto” region systemu wygrywa, gdy jest znany.
  if ((!preference || preference === "auto") && fromRegion) return fromRegion;

  // Jawny język: waluta typowa dla tego języka, z korektą regionu systemu.
  switch (locale) {
    case "pl":
      return "pln";
    case "de":
      return "eur";
    case "ru":
      return "rub";
    case "es": {
      if (fromRegion === "mxn" || fromRegion === "usd" || fromRegion === "eur") return fromRegion;
      for (const { lang, region } of tags) {
        if (lang === "es" && LATAM.has(region)) return region === "mx" ? "mxn" : "usd";
        if (lang === "es" && (region === "es" || EUROZONE.has(region))) return "eur";
      }
      return "eur";
    }
    case "en": {
      if (fromRegion === "gbp" || fromRegion === "aud" || fromRegion === "cad" || fromRegion === "usd") {
        return fromRegion;
      }
      if (fromRegion === "eur") return "eur";
      return "usd";
    }
    default:
      return fromRegion ?? "usd";
  }
}

export function crystalPackPriceLabel(
  packId: CrystalPackId,
  preference: LocalePreference | null | undefined,
  languages?: readonly string[],
): string {
  const region = resolvePriceRegion(preference, languages);
  return PACK_LABELS[region][packId];
}

export function premiumUnlockPriceLabel(
  preference: LocalePreference | null | undefined,
  languages?: readonly string[],
): string {
  const region = resolvePriceRegion(preference, languages);
  return PREMIUM_LABELS[region];
}
