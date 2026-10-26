import { LOCALE_OPTIONS, resolveLocale, type LocaleId, type LocalePreference } from "./locales";
import { MESSAGES, type MessageKey } from "./messages";

export type { LocaleId, LocalePreference, LocaleOption } from "./locales";
export { LOCALE_OPTIONS, detectSystemLocale, isLocaleId, resolveLocale } from "./locales";
export type { MessageKey } from "./messages";

export type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

function fill(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = vars[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}

export function createTranslator(locale: LocaleId): TranslateFn {
  const dict = MESSAGES[locale] ?? MESSAGES.en;
  const fallback = MESSAGES.en;
  return (key, vars) => fill(dict[key] ?? fallback[key] ?? key, vars);
}

export function translatorForPreference(preference: LocalePreference | null | undefined): {
  locale: LocaleId;
  t: TranslateFn;
} {
  const locale = resolveLocale(preference);
  return { locale, t: createTranslator(locale) };
}

export function localeNativeName(id: LocaleId): string {
  return LOCALE_OPTIONS.find((item) => item.id === id)?.native ?? id;
}
