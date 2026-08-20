import type { LocaleId } from "./locale.types";
import { DEFAULT_LOCALE } from "./locale.constants";

/** Países sin traducción regional pero con español como idioma oficial/dominante. ISO 3166-1 alpha-2. */
export const SPANISH_COUNTRIES: ReadonlySet<string> = new Set([
  "ES",
  "MX",
  "CO",
  "AR",
  "PE",
  "VE",
  "CL",
  "EC",
  "GT",
  "CU",
  "BO",
  "DO",
  "HN",
  "PY",
  "SV",
  "NI",
  "CR",
  "PA",
  "UY",
  "PR",
  "GQ",
]);

/** Países sin traducción regional pero con inglés como idioma oficial/dominante. */
export const ENGLISH_COUNTRIES: ReadonlySet<string> = new Set([
  "US",
  "GB",
  "CA",
  "AU",
  "NZ",
  "IE",
  "IN",
  "ZA",
  "NG",
  "GH",
  "KE",
  "PH",
  "SG",
  "JM",
  "TT",
  "BS",
  "BB",
  "GY",
  "PK",
  "LK",
  "ZM",
  "ZW",
  "UG",
  "TZ",
]);

/**
 * Idioma de respaldo para un país SIN traducción regional.
 * - hispanohablante → es-LA (español neutro)
 * - anglófono → en-US
 * - idioma desconocido → null (el llamador decide: navegador/default)
 *
 * Solo se consulta tras fallar `LOCALE_MAP`: nunca reemplaza la
 * traducción propia de un país cuando existe.
 */
export function fallbackLocaleForCountry(
  countryCode: string | null | undefined,
): LocaleId | null {
  if (!countryCode) return null;
  const normalized = countryCode.trim().toUpperCase();
  if (SPANISH_COUNTRIES.has(normalized)) return DEFAULT_LOCALE;
  if (ENGLISH_COUNTRIES.has(normalized)) return "en-US";
  return null;
}