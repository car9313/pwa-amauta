import { useTranslation } from "react-i18next";
import { useLocaleStore } from "../store/locale-store";
import { SUPPORTED_LOCALES } from "../domain/locale.config";

export function useLanguage() {
  const { t, i18n } = useTranslation();
  const resolvedLocale = useLocaleStore((state) => state.resolvedLocale);
  const isReady = useLocaleStore((state) => state.isReady);
  const userPreference = useLocaleStore((state) => state.userPreference);
  const setUserPreference = useLocaleStore((state) => state.setUserPreference);
  const resolveAndCacheLocale = useLocaleStore((state) => state.resolveAndCacheLocale);
  const resetLocale = useLocaleStore((state) => state.resetLocale);

  return {
    t,
    locale: resolvedLocale,
    i18n,
    userPreference,
    availableLocales: SUPPORTED_LOCALES,
    isReady,
    setPreference: setUserPreference,
    resolveAndCacheLocale,
    resetLocale,
  };
}
