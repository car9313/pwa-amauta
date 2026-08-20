import { create } from "zustand";
import i18next from "i18next";
import type { LocaleId, GeoResult } from "../domain/locale.types";
import { DEFAULT_LOCALE, LOCALE_NAMESPACES } from "../domain/locale.constants";
import { detectLocaleFromGeo } from "../infrastructure/geo-detection.service";

import {
  getUserCachedLocale,
  saveCachedLocale,
  isLocaleStale,
} from "../infrastructure/locale-persistence";
import { resolveLocale, getLocaleFromNavigator } from "../utils/locale-utils";

type GeoFailReason = Extract<GeoResult, { success: false }>["reason"];

function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log("[i18n]", ...args);
  }
}

interface LocaleState {
  resolvedLocale: LocaleId;
  isReady: boolean;
  userPreference: LocaleId | null;
  geoAlreadyRan: boolean;
  preAuthLocaleData: Record<string, Record<string, unknown>> | null;
  preAuthCountryCode: string | null;
  geoFailReason: GeoFailReason | null;
  geoVerificationInFlight: boolean;

  hydrateFromStorage: (userId: string) => Promise<boolean>;
  detectPreAuthLocale: (timeoutMs?: number) => Promise<void>;
  resolveAndCacheLocale: (userId: string) => Promise<void>;
  verifyLocaleAgainstGeo: (userId: string) => Promise<void>;
  setUserPreference: (locale: LocaleId, userId: string) => Promise<void>;
  resetLocale: () => void;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  resolvedLocale: DEFAULT_LOCALE,
  isReady: false,
  userPreference: null,
  geoAlreadyRan: false,
  preAuthLocaleData: null,
  preAuthCountryCode: null,
  geoFailReason: null,
  geoVerificationInFlight: false,

  hydrateFromStorage: async (userId: string): Promise<boolean> => {
    devLog("hydrateFromStorage: buscando cache para", userId);

    const cached = await getUserCachedLocale(userId);

    if (!cached || isLocaleStale(cached)) {
      devLog("cache inválido o no existe → irá a geo-detección");
      set({ isReady: true });
      return false;
    }

    const data = cached.data as Record<string, Record<string, unknown>>;
    for (const ns of LOCALE_NAMESPACES) {
      if (data[ns]) {
        i18next.addResourceBundle(cached.localeId, ns, data[ns], true, true);
      }
    }
    await i18next.changeLanguage(cached.localeId);

    set({
      resolvedLocale: cached.localeId,
      userPreference: cached.localeId,
      isReady: true,
    });

    return true;
  },

  detectPreAuthLocale: async (timeoutMs = 800) => {
    devLog("detectPreAuthLocale: iniciando con timeout", timeoutMs, "ms");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const geoResult = await detectLocaleFromGeo(controller.signal);
    clearTimeout(timer);

    const resolved = resolveLocale(geoResult, getLocaleFromNavigator());
    const failReason = geoResult.success ? null : geoResult.reason;

    if (resolved !== DEFAULT_LOCALE) {
      try {
        const response = await fetch(`/locales/${resolved}/translation.json`);
        if (response.ok) {
          const remoteData = (await response.json()) as Record<
            string,
            Record<string, unknown>
          >;
          set({ preAuthLocaleData: remoteData });
          for (const ns of LOCALE_NAMESPACES) {
            if (remoteData[ns]) {
              i18next.addResourceBundle(
                resolved,
                ns,
                remoteData[ns],
                true,
                true,
              );
            }
          }
        }
      } catch {
        /* Regional files not available yet — fall through to es-LA */
      }
    }
    devLog("locale resuelto:", resolved);
    devLog("geoResult:", geoResult);
    await i18next.changeLanguage(resolved);
    set({
      resolvedLocale: resolved,
      geoAlreadyRan: true,
      geoFailReason: failReason,
      preAuthCountryCode: geoResult.success ? geoResult.countryCode : null,
    });
  },

  resolveAndCacheLocale: async (userId) => {
    devLog("resolveAndCacheLocale: userId =", userId);
    devLog("geoAlreadyRan =", get().geoAlreadyRan);
    const cached = await getUserCachedLocale(userId);

    if (cached && !isLocaleStale(cached)) {
      const data = cached.data as Record<string, Record<string, unknown>>;
      for (const ns of LOCALE_NAMESPACES) {
        if (data[ns]) {
          i18next.addResourceBundle(cached.localeId, ns, data[ns], true, true);
        }
      }
      await i18next.changeLanguage(cached.localeId);
      set({
        resolvedLocale: cached.localeId,
        isReady: true,
        userPreference: cached.localeId,
      });
      return;
    }

    if (get().geoAlreadyRan) {
      const failReason = get().geoFailReason;

      // Si geo falló pre-auth por falta de conexión o timeout, y ahora hay red
      // (login requiere conexión → aquí siempre hay red), reintentamos con timeout completo
      const shouldRetryGeo = failReason === "network_error" || failReason === "timeout";

      if (shouldRetryGeo) {
        devLog("reintentando geo post-login, motivo previo:", failReason);
        const retryResult = await detectLocaleFromGeo();
        const retried = resolveLocale(retryResult, getLocaleFromNavigator());
        const retriedCountryCode = retryResult.success ? retryResult.countryCode : null;

        if (retried !== DEFAULT_LOCALE) {
          try {
            const response = await fetch(`/locales/${retried}/translation.json`);
            if (response.ok) {
              const remoteData = (await response.json()) as Record<string, Record<string, unknown>>;
              await saveCachedLocale(userId, retried, remoteData, retriedCountryCode);
              for (const ns of LOCALE_NAMESPACES) {
                if (remoteData[ns]) {
                  i18next.addResourceBundle(retried, ns, remoteData[ns], true, true);
                }
              }
              await i18next.changeLanguage(retried);
              set({
                resolvedLocale: retried,
                userPreference: retried,
                isReady: true,
                preAuthLocaleData: null,
                geoFailReason: null,
              });
              return;
            }
          } catch {
            // El reintento también falló → seguimos con locale pre-auth
          }
        }

        // El reintento tampoco mapeó un locale regional → persiste es-LA
        await saveCachedLocale(userId, retried, {}, retriedCountryCode);
        await i18next.changeLanguage(retried);
        set({
          resolvedLocale: retried,
          userPreference: retried,
          isReady: true,
          preAuthLocaleData: null,
          geoFailReason: null,
        });
        return;
      }

      // Sin reintento (rate_limited, unmapped_country, parse_error)
      // o el reintento falló → usar lo que ya tenemos de pre-auth
      const locale = get().resolvedLocale;
      const preAuthData = get().preAuthLocaleData;
      const preAuthCountryCode = get().preAuthCountryCode;

      await saveCachedLocale(userId, locale, preAuthData ?? {}, preAuthCountryCode);

      if (preAuthData) {
        for (const ns of LOCALE_NAMESPACES) {
          if (preAuthData[ns]) {
            i18next.addResourceBundle(locale, ns, preAuthData[ns], true, true);
          }
        }
      }

      await i18next.changeLanguage(locale);
      set({
        userPreference: locale,
        isReady: true,
        preAuthLocaleData: null,
        geoFailReason: null,
      });
      return;
    }

    const geoResult = await detectLocaleFromGeo();
    const resolved = resolveLocale(geoResult, getLocaleFromNavigator());
    const countryCode = geoResult.success ? geoResult.countryCode : null;

    if (resolved !== DEFAULT_LOCALE) {
      try {
        const response = await fetch(`/locales/${resolved}/translation.json`);
        if (response.ok) {
          const remoteData = (await response.json()) as Record<
            string,
            Record<string, unknown>
          >;
          await saveCachedLocale(userId, resolved, remoteData, countryCode);
          for (const ns of LOCALE_NAMESPACES) {
            if (remoteData[ns]) {
              i18next.addResourceBundle(
                resolved,
                ns,
                remoteData[ns],
                true,
                true,
              );
            }
          }
        }
      } catch {
        /* Regional files not available yet — fall through to es-LA */
      }
    } else {
      // locale es es-LA — está embebido, no hay fetch, pero guardamos la entrada en Dexie
      await saveCachedLocale(userId, resolved, {}, countryCode);
    }

    await i18next.changeLanguage(resolved);
    set({ resolvedLocale: resolved, userPreference: resolved, isReady: true });
  },

  // Verificación no bloqueante al inicio de sesión con cache válida (UC-6: viaje).
  // Solo cambia el idioma si la geo difiere del país con el que se resolvió la cache.
  verifyLocaleAgainstGeo: async (userId: string): Promise<void> => {
    if (get().geoVerificationInFlight) return;
    // Sin conexión: no intentar (la cache es la fuente de verdad offline)
    if (globalThis.navigator?.onLine === false) return;

    set({ geoVerificationInFlight: true });
    try {
      const cached = await getUserCachedLocale(userId);
      if (!cached || isLocaleStale(cached)) return;

      const geoResult = await detectLocaleFromGeo();
      if (!geoResult.success) return;

      // Mismo país que cuando se resolvió la cache → no-op
      if (geoResult.countryCode === cached.countryCode) return;

      // Mismo idioma pero país distinto → refrescar país de la cache
      if (geoResult.localeId === cached.localeId) {
        devLog("verify: mismo idioma, país distinto — refrescando countryCode");
        await saveCachedLocale(userId, cached.localeId, cached.data, geoResult.countryCode);
        return;
      }

      devLog("verify: país cambió", cached.countryCode, "→", geoResult.countryCode, "(", cached.localeId, "→", geoResult.localeId, ")");

      const locale = geoResult.localeId;
      if (locale !== DEFAULT_LOCALE) {
        try {
          const response = await fetch(`/locales/${locale}/translation.json`);
          if (response.ok) {
            const remoteData = (await response.json()) as Record<
              string,
              Record<string, unknown>
            >;
            await saveCachedLocale(userId, locale, remoteData, geoResult.countryCode);
            for (const ns of LOCALE_NAMESPACES) {
              if (remoteData[ns]) {
                i18next.addResourceBundle(locale, ns, remoteData[ns], true, true);
              }
            }
            await i18next.changeLanguage(locale);
            set({
              resolvedLocale: locale,
              userPreference: locale,
              isReady: true,
              geoFailReason: null,
            });
            return;
          }
        } catch {
          /* Regional files not available yet — se mantiene la cache */
        }
        return;
      }

      // es-LA está embebido: no hay fetch, solo actualizar cache
      await saveCachedLocale(userId, locale, {}, geoResult.countryCode);
      await i18next.changeLanguage(locale);
      set({
        resolvedLocale: locale,
        userPreference: locale,
        isReady: true,
        geoFailReason: null,
      });
    } finally {
      set({ geoVerificationInFlight: false });
    }
  },

  setUserPreference: async (locale, userId) => {
    set({ userPreference: locale, resolvedLocale: locale });
    // Actualiza el cache en Dexie con el nuevo locale elegido manualmente
    // Los datos quedan vacíos porque es-LA está embebido, las variantes se cargan al cambiar
    await saveCachedLocale(userId, locale, {});
    await i18next.changeLanguage(locale);
  },

  resetLocale: () => {
    set({
      resolvedLocale: DEFAULT_LOCALE,
      userPreference: null,
      geoAlreadyRan: false,
      preAuthLocaleData: null,
      preAuthCountryCode: null,
      geoFailReason: null,
      geoVerificationInFlight: false,
    });
  },
}));

export const selectResolvedLocale = (state: LocaleState) =>
  state.resolvedLocale;
export const selectIsLocaleReady = (state: LocaleState) => state.isReady;