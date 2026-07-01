import type { LocaleInfo } from "./locale.types";

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  {
    id: "es-LA",
    label: "Español latino neutro",
    flag: "latam",
    country: "Latinoamérica",
    isDefault: true,
  },
  {
    id: "es-MX",
    label: "Español (México)",
    flag: "mx",
    country: "México",
    isDefault: false,
  },
  {
    id: "es-AR",
    label: "Español (Argentina)",
    flag: "ar",
    country: "Argentina",
    isDefault: false,
  },
  {
    id: "es-CL",
    label: "Español (Chile)",
    flag: "cl",
    country: "Chile",
    isDefault: false,
  },
  {
    id: "es-CO",
    label: "Español (Colombia)",
    flag: "co",
    country: "Colombia",
    isDefault: false,
  },
  {
    id: "es-PE",
    label: "Español (Perú)",
    flag: "pe",
    country: "Perú",
    isDefault: false,
  },
];

export const LOCALE_MAP: Record<string, LocaleInfo["id"]> = {
  MX: "es-MX",
  AR: "es-AR",
  CL: "es-CL",
  CO: "es-CO",
  PE: "es-PE",
  US: "es-MX",  // TEMPORAL — solo para prueba
  BO: "es-LA", VE: "es-LA", EC: "es-LA", PY: "es-LA",
  UY: "es-LA", CR: "es-LA", GT: "es-LA", HN: "es-LA",
  SV: "es-LA", NI: "es-LA", PA: "es-LA", DO: "es-LA",
  CU: "es-MX",  // TEMPORAL — solo para prueba
  PR: "es-LA",
};
