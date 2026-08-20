import type { GeoResult } from "../domain/locale.types";
import { IPAPI_URL, IPAPI_TIMEOUT_MS } from "../domain/locale.constants";
import { LOCALE_MAP } from "../domain/locale.config";
import { fallbackLocaleForCountry } from "../domain/locale-languages";

function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log("[i18n][geo]", ...args);
  }
}

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
      devLog("rate_limited (429)");
      return { success: false, reason: "rate_limited" };
    }

    if (!response.ok) {
      devLog("HTTP", response.status, "→ network_error");
      return { success: false, reason: "network_error" };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      devLog("JSON inválido → parse_error");
      return { success: false, reason: "parse_error" };
    }

    const countryCode = (data as Record<string, unknown>)?.country_code;
    if (typeof countryCode !== "string") {
      devLog("sin country_code → parse_error");
      return { success: false, reason: "parse_error" };
    }

    const regional = LOCALE_MAP[countryCode];
    if (regional) {
      devLog(countryCode, "→ regional", regional);
      return { success: true, localeId: regional, countryCode };
    }

    const fallback = fallbackLocaleForCountry(countryCode);
    if (fallback) {
      devLog(countryCode, "→ idioma de respaldo", fallback);
      return { success: true, localeId: fallback, countryCode };
    }

    devLog(countryCode, "→ unmapped_country");
    return { success: false, reason: "unmapped_country" };
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof DOMException && error.name === "AbortError") {
      devLog("timeout");
      return { success: false, reason: "timeout" };
    }
    devLog("network_error");
    return { success: false, reason: "network_error" };
  }
}