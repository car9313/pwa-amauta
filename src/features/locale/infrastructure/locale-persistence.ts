import { db, type UserPreferencesEntry, type LocaleCacheEntry } from "@/lib/api/storage/db";
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
  await db.preferences.put(entry);
}

export async function getCachedLocale(
  userId: string,
  localeId: LocaleId,
): Promise<CacheableLocale | null> {
  const key = buildKey(userId, localeId);
  const entry = await db.preferences.get(key);
  if (!entry || !("userId" in entry)) return null;
  return {
    id: entry.id,
    userId: entry.userId,
    localeId: entry.localeId as LocaleId,
    data: entry.data as Record<string, unknown>,
    version: entry.version,
    cachedAt: entry.cachedAt,
  };
}

export async function getUserCachedLocale(
  userId: string,
): Promise<CacheableLocale | null> {
  const entry = await db.preferences
    .where("userId")
    .equals(userId)
    .first();
  if (!entry || !("userId" in entry)) return null;
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
