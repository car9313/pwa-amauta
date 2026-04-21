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

interface AuthDatabase extends Dexie {
  tokens: EntityTable<TokenData, "id">;
  users: EntityTable<StoredUser, "id">;
}

export const authDb = new Dexie("amauta-auth") as AuthDatabase;

authDb.version(1).stores({
  tokens: "id",
  users: "id",
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
  await authDb.transaction("rw", [authDb.tokens, authDb.users], async () => {
    await authDb.tokens.delete(AUTH_TOKEN_ID);
    await authDb.users.delete(AUTH_USER_ID);
  });
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