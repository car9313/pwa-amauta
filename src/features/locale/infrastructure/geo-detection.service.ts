import type { GeoResult, LocaleId } from "../domain/locale.types";
import { IPAPI_URL, IPAPI_TIMEOUT_MS } from "../domain/locale.constants";

const COUNTRY_TO_LOCALE: Record<string, LocaleId> = {
  MX: "es-MX",
  AR: "es-AR",
  CL: "es-CL",
  CO: "es-CO",
  PE: "es-PE",
  BO: "es-LA", VE: "es-LA", EC: "es-LA", PY: "es-LA",
  UY: "es-LA", CR: "es-LA", GT: "es-LA", HN: "es-LA",
  SV: "es-LA", NI: "es-LA", PA: "es-LA", DO: "es-LA",
  CU: "es-LA", PR: "es-LA",
};

export async function detectLocaleFromGeo(externalSignal?: AbortSignal): Promise<GeoResult> {
  const internalController = new AbortController();
  const timer = setTimeout(() => internalController.abort(), IPAPI_TIMEOUT_MS);

  const signal = externalSignal && typeof AbortSignal.any === "function"
    ? AbortSignal.any([internalController.signal, externalSignal])
    : externalSignal ?? internalController.signal;

  try {
    const response = await fetch(IPAPI_URL, {
      signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);

    if (response.status === 429) {
      return { success: false, reason: "rate_limited" };
    }

    if (!response.ok) {
      return { success: false, reason: "network_error" };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { success: false, reason: "parse_error" };
    }

    const countryCode = (data as Record<string, unknown>)?.country_code;
    if (typeof countryCode !== "string") {
      return { success: false, reason: "parse_error" };
    }

    const localeId = COUNTRY_TO_LOCALE[countryCode];
    if (!localeId) {
      return { success: false, reason: "unmapped_country" };
    }

    return { success: true, localeId };
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, reason: "timeout" };
    }
    return { success: false, reason: "network_error" };
  }
}
