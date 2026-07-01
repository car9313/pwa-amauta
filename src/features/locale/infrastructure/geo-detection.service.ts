import type { GeoResult } from "../domain/locale.types";
import { IPAPI_URL, IPAPI_TIMEOUT_MS } from "../domain/locale.constants";
import { LOCALE_MAP } from "../domain/locale.config";

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
console.log(response)

    if (response.status === 429) {
      return { success: false, reason: "rate_limited" };
    }

    if (!response.ok) {
      return { success: false, reason: "network_error" };
    }

    let data: unknown;
    try {
      data = await response.json();
      console.log(data)
    } catch {
      return { success: false, reason: "parse_error" };
    }

    const countryCode = (data as Record<string, unknown>)?.country_code;
    if (typeof countryCode !== "string") {
      return { success: false, reason: "parse_error" };
    }

    const localeId = LOCALE_MAP[countryCode];
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
