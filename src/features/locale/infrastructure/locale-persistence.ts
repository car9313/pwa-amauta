import { db, type UserPreferencesEntry, type LocaleCacheEntry, PreferencesEntry, LastActiveUserEntry } from "@/lib/api/storage/db";
import type { LocaleId, CacheableLocale } from "../domain/locale.types";
import { LOCALE_VERSIONS } from "../domain/locale.constants";

function buildKey(userId: string, localeId: LocaleId): string {
  return `${userId}:${localeId}`;
}

export async function saveLocalePreference(
  userId: string,
  localeId: LocaleId,
): Promise<void> {
  const existing = await db.preferences.get("user-preferences") as UserPreferencesEntry | undefined;
  await db.preferences.put({
    id: "user-preferences",
    selectedStudentId: existing?.selectedStudentId ?? null,
    locale: localeId,
    updatedAt: Date.now(),
  } as UserPreferencesEntry);
}

export async function getLocalePreference(): Promise<LocaleId | null> {
  const prefs = await db.preferences.get("user-preferences") as UserPreferencesEntry | undefined;
  return (prefs?.locale as LocaleId) ?? null;
}

export async function clearLocalePreference(): Promise<void> {
  const existing = await db.preferences.get("user-preferences") as UserPreferencesEntry | undefined;
  if (existing) {
    await db.preferences.put({
      ...existing,
      locale: null,
      updatedAt: Date.now(),
    } as UserPreferencesEntry);
  }
}

export async function saveCachedLocale(
  userId: string,
  localeId: LocaleId,
  data: Record<string, unknown>,
): Promise<void> {
  const entry: LocaleCacheEntry = {
    id: buildKey(userId, localeId),
    userId,
    localeId,
    data,
    version: LOCALE_VERSIONS[localeId],
    cachedAt: Date.now(),
  };
  console.log('[dexie] saveCachedLocale escribiendo:', entry)  // ← añade esto
  await db.preferences.put(entry);
  console.log('[dexie] saveCachedLocale completado')           // ← y esto
}

function isLocaleCacheEntry(entry: PreferencesEntry): entry is LocaleCacheEntry {
  return "userId" in entry && "localeId" in entry && "data" in entry;
}

function isLastActiveUserEntry(entry: PreferencesEntry): entry is LastActiveUserEntry {
  return entry.id === "last-active-user";
}

export async function getCachedLocale(
  userId: string,
  localeId: LocaleId,
): Promise<CacheableLocale | null> {
  const key = buildKey(userId, localeId);
  const entry = await db.preferences.get(key);
  if (!entry || !isLocaleCacheEntry(entry)) return null;
  return {
    id: entry.id,
    userId: entry.userId,
    localeId: entry.localeId as LocaleId,
    data: entry.data as Record<string, unknown>,
    version: entry.version,
    cachedAt: entry.cachedAt,
  };
}




/* export async function getUserCachedLocale(
  userId: string,
): Promise<CacheableLocale | null> {
  const entry = await db.preferences
    .where("userId")
    .equals(userId)
    .first();
  if (!entry || !isLocaleCacheEntry(entry)) return null;
  return {
    id: entry.id,
    userId: entry.userId,
    localeId: entry.localeId as LocaleId,
    data: entry.data as Record<string, unknown>,
    version: entry.version,
    cachedAt: entry.cachedAt,
  };
}
 */


export async function getUserCachedLocale(
  userId: string,
): Promise<CacheableLocale | null> {
  console.log('[dexie] getUserCachedLocale buscando userId:', userId)

  const entry = await db.preferences
    .where("userId")
    .equals(userId)
    .filter(e => e.id !== "last-active-user")  // ← excluye el puntero
    .first();

  console.log('[dexie] entry encontrada:', entry)
  console.log('[dexie] isLocaleCacheEntry:', entry ? isLocaleCacheEntry(entry) : 'no hay entry')

  if (!entry || !isLocaleCacheEntry(entry)) return null;

  return {
    id: entry.id,
    userId: entry.userId,
    localeId: entry.localeId as LocaleId,
    data: entry.data as Record<string, unknown>,
    version: entry.version,
    cachedAt: entry.cachedAt,
  };
}
export async function clearCachedLocale(
  userId: string,
  localeId: LocaleId,
): Promise<void> {
  await db.preferences.delete(buildKey(userId, localeId));
}

export async function clearAllUserCachedLocales(userId: string): Promise<void> {
  await db.preferences.where("userId").equals(userId).delete();
}

export function isLocaleStale(cached: CacheableLocale): boolean {
  return cached.version !== LOCALE_VERSIONS[cached.localeId];
}


/* Qué hacen: setLastActiveUserId escribe en la carpeta fija "last-active-user" quién fue la última persona autenticada. getLastActiveUserId la lee. Es solo un puntero — no contiene ningún diccionario de traducciones, solo dice "ve a buscar la carpeta de este userId en el Archivador B". */
export async function setLastActiveUserId(userId: string): Promise<void> {
  await db.preferences.put({
    id: "last-active-user",
    userId,
    updatedAt: Date.now(),
  } as LastActiveUserEntry);
}

export async function getLastActiveUserId(): Promise<string | null> {
  const entry = await db.preferences.get("last-active-user");
  if (!entry || !isLastActiveUserEntry(entry)) return null;
  return entry.userId;
}