import type { LocaleId } from "./locale.types";

export const DEFAULT_LOCALE: LocaleId = "es-LA";

export const IPAPI_TIMEOUT_MS = 5_000;

export const IPAPI_URL = "https://ipapi.co/json/";

export const LOCALE_VERSIONS: Record<LocaleId, string> = {
  "es-LA": "1.0.0",
  "es-MX": "1.0.0",
  "es-AR": "1.0.0",
  "es-CL": "1.0.0",
  "es-CO": "1.0.0",
  "es-PE": "1.0.0",
};

export const LOCALE_NAMESPACES = [
  "common",
  "auth",
  "navigation",
  "dashboard",
  "lessons",
  "exercises",
  "games",
  "practice",
  "progress",
  "role",
  "errors",
] as const;
