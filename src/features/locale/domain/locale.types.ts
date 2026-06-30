export type LocaleId =
  | "es-LA"
  | "es-MX"
  | "es-AR"
  | "es-CL"
  | "es-CO"
  | "es-PE";

export interface LocaleInfo {
  id: LocaleId;
  label: string;
  flag: string;
  country: string;
  isDefault: boolean;
}

export type GeoResult =
  | { success: true; localeId: LocaleId }
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
