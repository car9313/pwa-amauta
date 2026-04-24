import { getAccessToken } from "@/features/auth/infrastructure/auth-storage";
import { refreshAccessToken } from "@/lib/api/refresh";
import { mapHttpErrorToAuthError, type AuthErrorCode } from "@/features/auth/domain/auth-error";

export interface HttpClientConfig {
  baseUrl: string;
  getStudentId?: () => string | null;
  onUnauthorized?: (error: AuthErrorCode) => void;
  onRefreshFailed?: (error: AuthErrorCode) => void;
}

export interface RequestOptions extends RequestInit {
  studentId?: string | null;
  skipAuth?: boolean;
}

class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: AuthErrorCode,
    public isOffline: boolean = false
  ) {
    super(message);
    this.name = "HttpError";
  }
}

let httpClientInstance: HttpClient | null = null;
let refreshInProgress: Promise<boolean> | null = null;

export class HttpClient {
  private baseUrl: string;
  private getStudentId?: () => string | null;
  private onUnauthorized?: (error: AuthErrorCode) => void;
  private onRefreshFailed?: (error: AuthErrorCode) => void;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getStudentId = config.getStudentId;
    this.onUnauthorized = config.onUnauthorized;
    this.onRefreshFailed = config.onRefreshFailed;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    if (!navigator.onLine) {
      const offlineError = mapHttpErrorToAuthError(new Error("Network unavailable"), false);
      throw new HttpError(offlineError.message, 0, offlineError.code, true);
    }

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

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      const networkError = mapHttpErrorToAuthError(error as Error, false);
      throw new HttpError(networkError.message, 0, networkError.code, true);
    }

    if (response.status === 401 && !options.skipAuth) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options);
      }
      
      const errorData = await response.json().catch(() => ({}));
      const authError = mapHttpErrorToAuthError(
        new Error(errorData.message ?? "Unauthorized"),
        true
      );
      this.onUnauthorized?.(authError.code);
      throw new HttpError(authError.message, 401, authError.code);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const authError = mapHttpErrorToAuthError(
        new Error(errorData.message ?? `Error ${response.status}`),
        true
      );
      throw new HttpError(authError.message, response.status, authError.code);
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
      } catch (error) {
        const authError = mapHttpErrorToAuthError(error as Error, navigator.onLine);
        this.onRefreshFailed?.(authError.code);
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

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function getHttpErrorCode(error: unknown): AuthErrorCode | null {
  if (isHttpError(error)) {
    return error.code;
  }
  return null;
}

export { HttpError };
export type { AuthErrorCode } from "@/features/auth/domain/auth-error";

export const httpClient = {
  request: <T>(endpoint: string, options?: RequestOptions) =>
    getHttpClient().request<T>(endpoint, options),
};