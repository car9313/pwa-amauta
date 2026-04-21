import Dexie, { type EntityTable } from "dexie";
import type { AuthUser } from "@/features/auth/domain/types";

export interface TokenData {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
}

export interface StoredUser {
  id: string;
  user: AuthUser;
  storedAt: number;
}

export interface UserPreferences {
  id: string;
  selectedStudentId: string | null;
  updatedAt: number;
}

interface AuthDatabase extends Dexie {
  tokens: EntityTable<TokenData, "id">;
  users: EntityTable<StoredUser, "id">;
  preferences: EntityTable<UserPreferences, "id">;
}

export const authDb = new Dexie("amauta-auth") as AuthDatabase;

authDb.version(2).stores({
  tokens: "id",
  users: "id",
  preferences: "id",
});

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

  await authDb.transaction("rw", [authDb.tokens, authDb.users], async () => {
    await authDb.tokens.put({
      id: AUTH_TOKEN_ID,
      accessToken,
      refreshToken,
      expiresAt,
      createdAt: now,
    });

    await authDb.users.put({
      id: AUTH_USER_ID,
      user,
      storedAt: now,
    });
  });
}

export async function getStoredToken(): Promise<TokenData | undefined> {
  return authDb.tokens.get(AUTH_TOKEN_ID);
}

export async function getStoredUser(): Promise<StoredUser | undefined> {
  return authDb.users.get(AUTH_USER_ID);
}

export async function isAccessTokenValid(): Promise<boolean> {
  const token = await getStoredToken();
  if (!token) return false;
  return Date.now() < token.expiresAt;
}

export async function clearAuthData(): Promise<void> {
  console.debug("[AuthDB] Starting clearAuthData transaction");
  await authDb.transaction("rw", [authDb.tokens, authDb.users], async () => {
    console.debug("[AuthDB] Deleting tokens and users from Dexie");
    await authDb.tokens.delete(AUTH_TOKEN_ID);
    await authDb.users.delete(AUTH_USER_ID);
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

  await authDb.tokens.update(AUTH_TOKEN_ID, {
    accessToken,
    expiresAt,
  });
}

export async function saveSelectedStudentId(studentId: string | null): Promise<void> {
  const now = Date.now();
  await authDb.preferences.put({
    id: "user-preferences",
    selectedStudentId: studentId ?? "",
    updatedAt: now,
  });
}

export async function getSelectedStudentId(): Promise<string | null> {
  const prefs = await authDb.preferences.get("user-preferences");
  if (!prefs) return null;
  return prefs.selectedStudentId || null;
}

export async function clearSelectedStudentId(): Promise<void> {
  await authDb.preferences.delete("user-preferences");
}