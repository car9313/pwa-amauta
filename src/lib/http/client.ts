import { getAccessToken } from "@/features/auth/infrastructure/auth-storage";
import { refreshAccessToken } from "@/lib/api/refresh";

export interface HttpClientConfig {
  baseUrl: string;
  getStudentId?: () => string | null;
  onUnauthorized?: () => void;
  onRefreshFailed?: () => void;
}

export interface RequestOptions extends RequestInit {
  studentId?: string | null;
  skipAuth?: boolean;
}

let httpClientInstance: HttpClient | null = null;
let refreshInProgress: Promise<boolean> | null = null;

export class HttpClient {
  private baseUrl: string;
  private getStudentId?: () => string | null;
  private onUnauthorized?: () => void;
  private onRefreshFailed?: () => void;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getStudentId = config.getStudentId;
    this.onUnauthorized = config.onUnauthorized;
    this.onRefreshFailed = config.onRefreshFailed;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (!options.skipAuth) {
      const token = await getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const studentId = options.studentId ?? this.getStudentId?.();
    if (studentId) {
      headers["X-Student-Context"] = studentId;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !options.skipAuth) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options);
      }
      this.onUnauthorized?.();
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message ?? "Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error.message ?? `Error ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (refreshInProgress) {
      return refreshInProgress;
    }

    refreshInProgress = (async () => {
      try {
        await refreshAccessToken();
        return true;
      } catch {
        this.onRefreshFailed?.();
        return false;
      } finally {
        refreshInProgress = null;
      }
    })();

    return refreshInProgress;
  }
}

export function configureHttpClient(config: HttpClientConfig): HttpClient {
  httpClientInstance = new HttpClient(config);
  return httpClientInstance;
}

export function getHttpClient(): HttpClient {
  if (!httpClientInstance) {
    throw new Error("HttpClient no configurado. Llama a configureHttpClient primero.");
  }
  return httpClientInstance;
}

export const httpClient = {
  request: <T>(endpoint: string, options?: RequestOptions) =>
    getHttpClient().request<T>(endpoint, options),
};