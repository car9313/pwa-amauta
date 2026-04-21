import type { AuthUser } from "@/features/auth/domain/types";
import type { AuthResponse } from "../domain/types";
import {
  saveAuthData,
  getStoredToken,
  getStoredUser,
  isAccessTokenValid,
  clearAuthData,
  updateAccessToken,
  type TokenData,
} from "@/lib/api/storage/auth-db";

export { getStoredToken, getStoredUser } from "@/lib/api/storage/auth-db";
export type { TokenData } from "@/lib/api/storage/auth-db";

export interface AuthStorage {
  saveTokens: (response: AuthResponse) => Promise<void>;
  getToken: () => Promise<TokenData | null>;
  getUser: () => Promise<AuthUser | null>;
  isValid: () => Promise<boolean>;
  clear: () => Promise<void>;
  refreshAccess: (refreshToken: string) => Promise<{ access: string; expiresIn: number }>;
}

export async function getAccessToken(): Promise<string | null> {
  const token = await getStoredToken();
  return token?.accessToken ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const token = await getStoredToken();
  return token?.refreshToken ?? null;
}

export async function saveAuthResponse(response: AuthResponse): Promise<void> {
  const { token: access, refresh, expiresIn = 900, user } = response;
  await saveAuthData(access, refresh ?? "mock_refresh", expiresIn, user);
}

export async function loadAuthFromStorage(): Promise<{
  user: AuthUser | null;
} | null> {
  const userData = await getStoredUser();
  if (!userData) return null;
  return {
    user: userData.user,
  };
}

export async function checkAuthValidity(): Promise<boolean> {
  return isAccessTokenValid();
}

export async function clearAuth(): Promise<void> {
  await clearAuthData();
}

export async function updateAccess(
  access: string,
  expiresIn: number
): Promise<void> {
  await updateAccessToken(access, expiresIn);
}

export const authStorage = {
  saveAuthResponse,
  getAccessToken,
  getRefreshToken,
  loadAuthFromStorage,
  checkAuthValidity,
  clearAuth,
  updateAccess,
};