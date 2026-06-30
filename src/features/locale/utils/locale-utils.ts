import type { LocaleId, GeoResult } from "../domain/locale.types";
import { DEFAULT_LOCALE } from "../domain/locale.constants";
import { SUPPORTED_LOCALES } from "../domain/locale.config";

export function resolveLocale(
  geoResult: GeoResult,
  navigatorLang: string | null,
): LocaleId {
  if (geoResult.success) return geoResult.localeId;

  const fromNavigator = getLocaleFromNavigator(navigatorLang);
  if (fromNavigator) return fromNavigator;

  return DEFAULT_LOCALE;
}

export function isLocaleSupported(locale: string): boolean {
  return SUPPORTED_LOCALES.some((l) => l.id === locale);
}

export function getLocaleFromNavigator(
  navigatorLang?: string | null,
): LocaleId | null {
  const lang = navigatorLang ?? globalThis.navigator?.language;
  if (!lang) return null;

  const parts = lang.split("-");
  if (parts[0].toLowerCase() === "es" && parts.length >= 2) {
    const candidate = `es-${parts[1].toUpperCase()}` as LocaleId;
    if (isLocaleSupported(candidate)) return candidate;
  }

  return null;
}
