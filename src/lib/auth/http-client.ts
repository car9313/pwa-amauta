import { authAdapter } from "@/features/auth/infraestructure/mappers/adapter";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_VERSION = import.meta.env.VITE_API_VERSION ?? "v1";
const API_URL = `${API_BASE_URL}/${API_VERSION}`;

const ENDPOINTS_REQUIRING_STUDENT_ID = [
  "/next-exercise",
  "/submit-answer",
  "/progress",
  "/students/",
];

function injectStudentId(body: unknown, studentId: string): unknown {
  if (typeof body !== "object" || body === null) {
    return { studentId };
  }
  return { ...body, studentId };
}

function needsStudentId(endpoint: string): boolean {
  return ENDPOINTS_REQUIRING_STUDENT_ID.some((path) => endpoint.includes(path));
}

export interface HttpClientOptions extends RequestInit {
  skipAuth?: boolean;
  skipTenant?: boolean;
  skipStudentId?: boolean;
}

function getActiveStudentId(): string | null {
  const user = useAuthStore.getState().user;
  const selectedStudentId = useAuthStore.getState().selectedStudentId;

  if (user?.role === "student") {
    return "studentId" in user ? user.studentId : null;
  }
  if (user?.role === "parent" && selectedStudentId) {
    const childIds = user.children.map((c) => c.studentId);
    if (childIds.includes(selectedStudentId)) {
      return selectedStudentId;
    }
  }
  return null;
}

export async function httpClient<T>(
  endpoint: string,
  options: HttpClientOptions = {}
): Promise<T> {
  const { skipAuth = false, skipTenant = false, skipStudentId = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = authAdapter.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  if (!skipTenant) {
    const user = useAuthStore.getState().user;
    if (user?.tenantId) {
      headers["X-Tenant-Id"] = user.tenantId;
    }
  }

  let body = fetchOptions.body;

  if (typeof body === "string" && !skipStudentId) {
    try {
      const parsed = JSON.parse(body);
      const studentId = getActiveStudentId();

      if (studentId && needsStudentId(endpoint)) {
        const injected = injectStudentId(parsed, studentId);
        body = JSON.stringify(injected);
        headers["X-Student-Context"] = studentId;
      }
    } catch {
      // Not JSON
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    body,
  });

  if (response.status === 401 || response.status === 403) {
    useAuthStore.getState().clearSession();
    window.location.href = "/login";
    throw new Error(response.status === 401 ? "Sesión expirada" : "Acceso denegado");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.message ?? `Error ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: HttpClientOptions) =>
    httpClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: HttpClientOptions) =>
    httpClient<T>(endpoint, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),

  put: <T>(endpoint: string, body?: unknown, options?: HttpClientOptions) =>
    httpClient<T>(endpoint, { ...options, method: "PUT", body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(endpoint: string, body?: unknown, options?: HttpClientOptions) =>
    httpClient<T>(endpoint, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(endpoint: string, options?: HttpClientOptions) =>
    httpClient<T>(endpoint, { ...options, method: "DELETE" }),
};
