export type LocaleErrorCode =
  | "GEO_DETECTION_FAILED"
  | "LOCALE_NOT_SUPPORTED"
  | "LOCALE_CACHE_MISS"
  | "LOCALE_VERSION_MISMATCH"
  | "LOCALE_DOWNLOAD_FAILED"
  | "LOCALE_PARSE_ERROR";

export interface LocaleError {
  code: LocaleErrorCode;
  message: string;
}

export const LOCALE_ERROR_MESSAGES: Record<LocaleErrorCode, string> = {
  GEO_DETECTION_FAILED: "No se pudo detectar tu ubicación. Usando idioma por defecto.",
  LOCALE_NOT_SUPPORTED: "El idioma detectado no está soportado. Usando español latino neutro.",
  LOCALE_CACHE_MISS: "No hay traducciones en caché para este idioma.",
  LOCALE_VERSION_MISMATCH: "Las traducciones guardadas están desactualizadas. Se descargarán en la próxima conexión.",
  LOCALE_DOWNLOAD_FAILED: "No se pudieron descargar las traducciones. Revisa tu conexión.",
  LOCALE_PARSE_ERROR: "Error al procesar las traducciones descargadas.",
};
