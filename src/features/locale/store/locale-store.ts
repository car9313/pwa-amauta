import { create } from "zustand";
import i18next from "i18next";
import type { LocaleId } from "../domain/locale.types";
import { DEFAULT_LOCALE, LOCALE_NAMESPACES } from "../domain/locale.constants";
import { detectLocaleFromGeo } from "../infrastructure/geo-detection.service";
import {
  getUserCachedLocale,
  saveCachedLocale,
  isLocaleStale,
  getLastActiveUserId,
  setLastActiveUserId,
} from "../infrastructure/locale-persistence";
import { resolveLocale, getLocaleFromNavigator } from "../utils/locale-utils";

interface LocaleState {
  resolvedLocale: LocaleId;
  isReady: boolean;
  userPreference: LocaleId | null;
  geoAlreadyRan: boolean;
  preAuthLocaleData: Record<string, Record<string, unknown>> | null;

  /* Qué cambió funcionalmente: antes, hydrateFromStorage solo sabía decir "el idioma se llama es-MX" sin tener el diccionario. Ahora hace dos pasos: primero pregunta "¿quién fue la última persona?", y con esa respuesta va directo a buscar su carpeta completa (Archivador B), que sí tiene el diccionario entero.
Cómo afecta al flujo de i18n — exactamente tu edge case: un usuario que cerró sesión y vuelve a abrir la app ya no depende de hacer login para tener traducciones reales. hydrateFromStorage encuentra su userId guardado, va al Archivador B, y aplica el diccionario completo de es-MX (o el locale que sea) antes de que se muestre el login. El login ya no cae al fallback es-LA en ese caso. */

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

  /*  hydrateFromStorage: async () => {
    const pref = await getLocalePreference();
    if (pref) {
      set({ userPreference: pref, resolvedLocale: pref });
      await i18next.changeLanguage(pref);
      return true;
    }
    return false;
  }, */

  hydrateFromStorage: async (): Promise<boolean> => {
    console.log("[i18n] hydrateFromStorage: iniciando...");
    const lastUserId = await getLastActiveUserId();
    console.log("[i18n] lastUserId encontrado:", lastUserId);
    if (!lastUserId) {
      console.log("[i18n] Sin userId conocido → irá a geo-detección");
      set({ isReady: true });
      return false; // no hay nadie conocido — la app pasará a geo-detección pre-auth
    }

    const cached = await getUserCachedLocale(lastUserId);
console.log('[i18n] cache encontrado:', cached)        // ← añade esta línea
  console.log('[i18n] isStale:', cached ? isLocaleStale(cached) : 'no hay cache')  // ← y esta


    if (!cached || isLocaleStale(cached)) {
       console.log('[i18n] cache inválido o stale → geo-detección')  // ← y esta
      set({ isReady: true });
      return false; // hay un userId conocido pero su cache no es válido — geo-detección de nuevo
    }

    // Encontramos la carpeta completa del Archivador B: aplicamos el diccionario real
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

    return true; // login/register ya van a mostrar el diccionario real, no es-LA
  },

  detectPreAuthLocale: async (timeoutMs = 800) => {
    console.log(
      "[i18n] detectPreAuthLocale: iniciando con timeout",
      timeoutMs,
      "ms",
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const geoResult = await detectLocaleFromGeo(controller.signal);
    clearTimeout(timer);

    const resolved = resolveLocale(geoResult, getLocaleFromNavigator());

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
    console.log("[i18n] locale resuelto:", resolved);
    console.log("[i18n] geoResult:", geoResult);
    await i18next.changeLanguage(resolved);
    set({ resolvedLocale: resolved, geoAlreadyRan: true });
  },

  /* Qué hace este cambio: cada vez que un usuario completa exitosamente la resolución de su locale (ya sea porque tenía cache válido o porque acaba de detectarlo por primera vez), se actualiza el puntero "última persona que usó la app" con su userId.
Cómo afecta al flujo de i18n: esto es lo que hace que el Paso 3 funcione. Sin esta línea, getLastActiveUserId() siempre devolvería null porque nadie habría escrito ahí nunca. Con esta línea, cada login exitoso deja un rastro que la próxima sesión pre-auth puede seguir. 
Cuando el locale es es-LA, preAuthData es null (porque no se hace fetch de es-LA, ya está embebido). Entonces saveCachedLocale nunca se ejecuta y la entrada "stu_001:es-LA" nunca se crea en Dexie.
La próxima vez que hydrateFromStorage busque, encuentra lastActiveUserId = "stu_001", luego busca getUserCachedLocale("stu_001") y no encuentra nada → vuelve a geo-detección innecesariamente.
*/

  resolveAndCacheLocale: async (userId) => {
    console.log("[i18n] resolveAndCacheLocale: userId =", userId);
    console.log("[i18n] geoAlreadyRan =", get().geoAlreadyRan);
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
      console.log("[i18n] persistiendo en Dexie para userId:", userId);
      await setLastActiveUserId(userId);
      return;
    }

    if (get().geoAlreadyRan) {
      const locale = get().resolvedLocale;
      const preAuthData = get().preAuthLocaleData;

      // Siempre persistimos, aunque sea con datos vacíos (es-LA ya está embebido)
      await saveCachedLocale(userId, locale, preAuthData ?? {});

      if (preAuthData) {
        for (const ns of LOCALE_NAMESPACES) {
          if (preAuthData[ns]) {
            i18next.addResourceBundle(locale, ns, preAuthData[ns], true, true);
          }
        }
      }

      await i18next.changeLanguage(locale);
      await setLastActiveUserId(userId); // ← esta línea también faltaba aquí
      set({ userPreference: locale, isReady: true, preAuthLocaleData: null });
      return;
    }

    const geoResult = await detectLocaleFromGeo();
    const resolved = resolveLocale(geoResult, getLocaleFromNavigator());

    if (resolved !== DEFAULT_LOCALE) {
      try {
        const response = await fetch(`/locales/${resolved}/translation.json`);
        if (response.ok) {
          const remoteData = (await response.json()) as Record<
            string,
            Record<string, unknown>
          >;
          await saveCachedLocale(userId, resolved, remoteData);
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
      await saveCachedLocale(userId, resolved, {});
    }

    await i18next.changeLanguage(resolved);
    set({ resolvedLocale: resolved, userPreference: resolved, isReady: true });
    await setLastActiveUserId(userId);
  
  },

  setUserPreference: async (locale, userId) => {
    set({ userPreference: locale, resolvedLocale: locale });
    // Actualiza el cache en Dexie con el nuevo locale elegido manualmente
    // Los datos quedan vacíos porque es-LA está embebido, las variantes se cargan al cambiar
    await saveCachedLocale(userId, locale, {});
    await setLastActiveUserId(userId);
    await i18next.changeLanguage(locale);
  },

  resetLocale: () => {
    set({
      resolvedLocale: DEFAULT_LOCALE,
      userPreference: null,
      geoAlreadyRan: false,
      preAuthLocaleData: null,
    });
  },
}));

export const selectResolvedLocale = (state: LocaleState) =>
  state.resolvedLocale;
export const selectIsLocaleReady = (state: LocaleState) => state.isReady;
