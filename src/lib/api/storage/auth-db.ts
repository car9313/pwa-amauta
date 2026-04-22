import type { AuthUser } from "@/features/auth/domain/types";
import { db, type TokenData, type StoredUser } from "./db";

export { type TokenData, type StoredUser } from "./db";

export const AUTH_TOKEN_ID = "amauta-tokens";
export const AUTH_USER_ID = "amauta-user";

export async function saveAuthData(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  user: AuthUser
): Promise<void> {
  const now = Date.now();
  const expiresAt = now + expiresIn * 1000;

  await db.transaction("rw", [db.tokens, db.users], async () => {
    await db.tokens.put({
      id: AUTH_TOKEN_ID,
      accessToken,
      refreshToken,
      expiresAt,
      createdAt: now,
    });

    await db.users.put({
      id: AUTH_USER_ID,
      user,
      storedAt: now,
    });
  });
}

export async function getStoredToken(): Promise<TokenData | undefined> {
  return db.tokens.get(AUTH_TOKEN_ID);
}

export async function getStoredUser(): Promise<StoredUser | undefined> {
  return db.users.get(AUTH_USER_ID);
}

export async function isAccessTokenValid(): Promise<boolean> {
  const token = await getStoredToken();
  if (!token) return false;
  return Date.now() < token.expiresAt;
}

export async function clearAuthData(): Promise<void> {
  console.debug("[AuthDB] Starting clearAuthData transaction");
  await db.transaction("rw", [db.tokens, db.users], async () => {
    console.debug("[AuthDB] Deleting tokens and users from Dexie");
    await db.tokens.delete(AUTH_TOKEN_ID);
    await db.users.delete(AUTH_USER_ID);
    console.debug("[AuthDB] Tokens and users deleted successfully");
  });
  console.debug("[AuthDB] clearAuthData completed");
}

export async function updateAccessToken(
  accessToken: string,
  expiresIn: number
): Promise<void> {
  const token = await getStoredToken();
  if (!token) return;

  const now = Date.now();
  const expiresAt = now + expiresIn * 1000;

  await db.tokens.update(AUTH_TOKEN_ID, {
    accessToken,
    expiresAt,
  });
}

export async function saveSelectedStudentId(studentId: string | null): Promise<void> {
  const now = Date.now();
  await db.preferences.put({
    id: "user-preferences",
    selectedStudentId: studentId ?? "",
    updatedAt: now,
  });
}

export async function getSelectedStudentId(): Promise<string | null> {
  const prefs = await db.preferences.get("user-preferences");
  if (!prefs) return null;
  return prefs.selectedStudentId || null;
}

export async function clearSelectedStudentId(): Promise<void> {
  await db.preferences.delete("user-preferences");
}