export type LocaleId = "en" | "pl" | "de" | "es" | "ru";

export type LocaleOption = {
  id: LocaleId;
  /** Nazwa w języku własnym (do listy w ustawieniach). */
  native: string;
};

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { id: "en", native: "English" },
  { id: "pl", native: "Polski" },
  { id: "de", native: "Deutsch" },
  { id: "es", native: "Español" },
  { id: "ru", native: "Русский" },
];

const SUPPORTED = new Set<string>(LOCALE_OPTIONS.map((item) => item.id));

export function isLocaleId(value: string | null | undefined): value is LocaleId {
  return typeof value === "string" && SUPPORTED.has(value);
}

/**
 * Język systemu: pl / de / es / ru / en.
 * Nieznany kod → angielski.
 */
export function detectSystemLocale(
  languages: readonly string[] = typeof navigator !== "undefined"
    ? [...(navigator.languages ?? []), navigator.language]
    : ["en"],
): LocaleId {
  for (const raw of languages) {
    if (!raw) continue;
    const code = raw.trim().toLowerCase().slice(0, 2);
    if (isLocaleId(code)) return code;
  }
  return "en";
}

export type LocalePreference = LocaleId | "auto";

export function resolveLocale(preference: LocalePreference | null | undefined): LocaleId {
  if (preference && preference !== "auto" && isLocaleId(preference)) return preference;
  return detectSystemLocale();
}
