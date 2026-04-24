import { getRefreshToken, updateAccess, clearAuth } from "@/features/auth/infrastructure/auth-storage";

export interface RefreshResponse {
  access: string;
  expiresIn: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const USE_MOCKS = import.meta.env.VITE_USE_MOCK === "true";

export async function refreshAccessToken(): Promise<RefreshResponse> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  if (USE_MOCKS || !API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newAccess = "mock_access_" + Date.now();
    await updateAccess(newAccess, 900);
    return { access: newAccess, expiresIn: 900 };
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      await clearAuth();
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? "Refresh failed");
  }

  const data = await response.json();
  await updateAccess(data.access, data.expiresIn);
  return data;
}

export async function isAccessTokenExpired(): Promise<boolean> {
  const token = await getRefreshToken();
  if (!token) return true;
  return false;
}