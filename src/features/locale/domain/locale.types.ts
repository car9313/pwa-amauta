export type LocaleId =
  | "es-LA"
  | "es-MX"
  | "es-AR"
  | "es-CL"
  | "es-CO"
  | "es-PE"
  | "en-US";

export interface LocaleInfo {
  id: LocaleId;
  label: string;
  flag: string;
  country: string;
  isDefault: boolean;
}

export type GeoResult =
  | { success: true; localeId: LocaleId; countryCode: string }
  | {
      success: false;
      reason: "timeout" | "rate_limited" | "network_error" | "unmapped_country" | "parse_error";
    };

export interface CacheableLocale {
  id: string;
  userId: string;
  localeId: LocaleId;
  data: Record<string, unknown>;
  version: string;
  cachedAt: number;
  /** País (ISO 3166-1 alpha-2) desde el que se resolvió la cache. null si es cache legacy. */
  countryCode?: string | null;
}

export type LocaleNamespace =
  | "common"
  | "auth"
  | "navigation"
  | "dashboard"
  | "lessons"
  | "exercises"
  | "games"
  | "practice"
  | "progress"
  | "role"
  | "errors";
