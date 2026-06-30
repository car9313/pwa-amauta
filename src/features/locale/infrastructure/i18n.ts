import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE } from "../domain/locale.constants";
import esLACommon from "./resources/es-LA/common.json";
import esLAAuth from "./resources/es-LA/auth.json";
import esLANavigation from "./resources/es-LA/navigation.json";
import esLADashboard from "./resources/es-LA/dashboard.json";
import esLALessons from "./resources/es-LA/lessons.json";
import esLAExercises from "./resources/es-LA/exercises.json";
import esLAGames from "./resources/es-LA/games.json";
import esLAPractice from "./resources/es-LA/practice.json";
import esLAProgress from "./resources/es-LA/progress.json";
import esLARole from "./resources/es-LA/role.json";
import esLAErrors from "./resources/es-LA/errors.json";

const esLAResources = {
  common: esLACommon,
  auth: esLAAuth,
  navigation: esLANavigation,
  dashboard: esLADashboard,
  lessons: esLALessons,
  exercises: esLAExercises,
  games: esLAGames,
  practice: esLAPractice,
  progress: esLAProgress,
  role: esLARole,
  errors: esLAErrors,
};

const initPromise = i18next.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  resources: {
    [DEFAULT_LOCALE]: esLAResources,
  },
  interpolation: {
    escapeValue: false,
  },
  ns: Object.keys(esLAResources),
  defaultNS: "common",
  returnObjects: true,
});

void initPromise;

export { esLAResources };
export type EsLAResources = typeof esLAResources;
export default i18next;
