import { create } from "zustand";
import i18next from "i18next";
import type { LocaleId } from "../domain/locale.types";
import { DEFAULT_LOCALE, LOCALE_NAMESPACES } from "../domain/locale.constants";
import { detectLocaleFromGeo } from "../infrastructure/geo-detection.service";
import {
  saveLocalePreference,
  getLocalePreference,
  getUserCachedLocale,
  saveCachedLocale,
  isLocaleStale,
} from "../infrastructure/locale-persistence";
import { resolveLocale, getLocaleFromNavigator } from "../utils/locale-utils";

interface LocaleState {
  resolvedLocale: LocaleId;
  isReady: boolean;
  userPreference: LocaleId | null;
  geoAlreadyRan: boolean;
  preAuthLocaleData: Record<string, Record<string, unknown>> | null;

  hydrateFromStorage: () => Promise<boolean>;
  detectPreAuthLocale: (timeoutMs?: number) => Promise<void>;
  resolveAndCacheLocale: (userId: string) => Promise<void>;
  setUserPreference: (locale: LocaleId, userId: string) => Promise<void>;
  resetLocale: () => void;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  resolvedLocale: DEFAULT_LOCALE,
  isReady: false,
  userPreference: null,
  geoAlreadyRan: false,
  preAuthLocaleData: null,

  hydrateFromStorage: async () => {
    const pref = await getLocalePreference();
    if (pref) {
      set({ userPreference: pref, resolvedLocale: pref });
      await i18next.changeLanguage(pref);
      return true;
    }
    return false;
  },

  detectPreAuthLocale: async (timeoutMs = 800) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const geoResult = await detectLocaleFromGeo(controller.signal);
    clearTimeout(timer);

    const resolved = resolveLocale(geoResult, getLocaleFromNavigator());

    if (resolved !== DEFAULT_LOCALE) {
      try {
        const response = await fetch(`/locales/${resolved}/translation.json`);
        if (response.ok) {
          const remoteData = await response.json() as Record<string, Record<string, unknown>>;
          set({ preAuthLocaleData: remoteData });
          for (const ns of LOCALE_NAMESPACES) {
            if (remoteData[ns]) {
              i18next.addResourceBundle(resolved, ns, remoteData[ns], true, true);
            }
          }
        }
      } catch {
        /* Regional files not available yet — fall through to es-LA */
      }
    }

    await i18next.changeLanguage(resolved);
    set({ resolvedLocale: resolved, geoAlreadyRan: true });
  },

  resolveAndCacheLocale: async (userId) => {
    const cached = await getUserCachedLocale(userId);

    if (cached && !isLocaleStale(cached)) {
      const data = cached.data as Record<string, Record<string, unknown>>;
      for (const ns of LOCALE_NAMESPACES) {
        if (data[ns]) {
          i18next.addResourceBundle(cached.localeId, ns, data[ns], true, true);
        }
      }
      await i18next.changeLanguage(cached.localeId);
      set({ resolvedLocale: cached.localeId, isReady: true, userPreference: cached.localeId });
      return;
    }

    if (get().geoAlreadyRan) {
      const locale = get().resolvedLocale;
      const preAuthData = get().preAuthLocaleData;
      await saveLocalePreference(userId, locale);
      if (preAuthData) {
        await saveCachedLocale(userId, locale, preAuthData);
      }
      set({ userPreference: locale, isReady: true, preAuthLocaleData: null });
      return;
    }

    const geoResult = await detectLocaleFromGeo();
    const resolved = resolveLocale(geoResult, getLocaleFromNavigator());

    await saveLocalePreference(userId, resolved);

    if (resolved !== DEFAULT_LOCALE) {
      try {
        const response = await fetch(`/locales/${resolved}/translation.json`);
        if (response.ok) {
          const remoteData = await response.json() as Record<string, Record<string, unknown>>;
          await saveCachedLocale(userId, resolved, remoteData);
          for (const ns of LOCALE_NAMESPACES) {
            if (remoteData[ns]) {
              i18next.addResourceBundle(resolved, ns, remoteData[ns], true, true);
            }
          }
        }
      } catch {
        /* Regional files not available yet — fall through to es-LA */
      }
    }

    await i18next.changeLanguage(resolved);
    set({ resolvedLocale: resolved, userPreference: resolved, isReady: true });
  },

  setUserPreference: async (locale, userId) => {
    set({ userPreference: locale, resolvedLocale: locale });
    await saveLocalePreference(userId, locale);
    await i18next.changeLanguage(locale);
  },

  resetLocale: () => {
    set({ resolvedLocale: DEFAULT_LOCALE, userPreference: null, geoAlreadyRan: false, preAuthLocaleData: null });
  },
}));

export const selectResolvedLocale = (state: LocaleState) => state.resolvedLocale;
export const selectIsLocaleReady = (state: LocaleState) => state.isReady;
