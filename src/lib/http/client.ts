import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
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
  skipTenant?: boolean;
  skipStudentId?: boolean;
}

const ENDPOINTS_REQUIRING_STUDENT_ID = [
  "/next-exercise",
  "/submit-answer",
  "/progress",
  "/students/",
];

class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: AuthErrorCode,
    public isOffline: boolean = false,
    public serverData?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

let httpClientInstance: HttpClient | null = null;
let refreshInProgress: Promise<boolean> | null = null;

function getActiveStudentId(): string | null {
  const user = useAuthStore.getState().user;
  const selectedStudentId = useAuthStore.getState().selectedStudentId;

  if (user?.role === "student") {
    return "studentId" in user ? (user as Record<string, unknown>).studentId as string : null;
  }
  if (user?.role === "parent" && selectedStudentId) {
    const childIds = user.children.map((c) => c.studentId);
    if (childIds.includes(selectedStudentId)) {
      return selectedStudentId;
    }
  }
  return null;
}

function getTenantId(): string | null {
  const user = useAuthStore.getState().user;
  return user?.tenantId ?? null;
}

function needsStudentId(endpoint: string): boolean {
  return ENDPOINTS_REQUIRING_STUDENT_ID.some((path) => endpoint.includes(path));
}

function injectStudentIdInBody(body: string | undefined, studentId: string): string | undefined {
  if (!body) return body;
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === "object" && parsed !== null) {
      return JSON.stringify({ ...parsed, studentId });
    }
  } catch {
    // Not JSON body
  }
  return body;
}

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

    if (!options.skipTenant) {
      const tenantId = getTenantId();
      if (tenantId) {
        headers["X-Tenant-Id"] = tenantId;
      }
    }

    const studentId = options.studentId ?? this.getStudentId?.() ?? getActiveStudentId();
    if (studentId) {
      headers["X-Student-Context"] = studentId;
    }

    let body = options.body as string | undefined;
    if (studentId && !options.skipStudentId && needsStudentId(endpoint)) {
      body = injectStudentIdInBody(body, studentId);
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        body,
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

      if (response.status === 409) {
        throw new HttpError(
          errorData.message ?? "Conflict",
          response.status,
          "CONFLICT",
          false,
          errorData
        );
      }

      const authError = mapHttpErrorToAuthError(
        new Error(errorData.message ?? `Error ${response.status}`),
        true
      );
      throw new HttpError(authError.message, response.status, authError.code);
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
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
    const baseUrl = `${import.meta.env.VITE_API_BASE_URL ?? ""}/${import.meta.env.VITE_API_VERSION ?? "v1"}`;
    httpClientInstance = new HttpClient({ baseUrl });
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
  get: <T>(endpoint: string, options?: RequestOptions) =>
    getHttpClient().get<T>(endpoint, options),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    getHttpClient().post<T>(endpoint, body, options),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    getHttpClient().put<T>(endpoint, body, options),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    getHttpClient().patch<T>(endpoint, body, options),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    getHttpClient().delete<T>(endpoint, options),
};