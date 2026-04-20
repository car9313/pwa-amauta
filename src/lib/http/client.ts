export interface HttpClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
  getStudentId?: () => string | null;
  onUnauthorized?: () => void;
}

export interface RequestOptions extends RequestInit {
  studentId?: string | null;
}

export class HttpClient {
  private baseUrl: string;
  private getToken?: () => string | null;
  private getStudentId?: () => string | null;
  private onUnauthorized?: () => void;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getToken = config.getToken;
    this.getStudentId = config.getStudentId;
    this.onUnauthorized = config.onUnauthorized;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken?.();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const studentId = options.studentId ?? this.getStudentId?.();
    if (studentId) {
      headers["X-Student-Context"] = studentId;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }
      const error = await response.json().catch(() => ({}));
      const message = error.message ?? `Error ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }
}

let httpClientInstance: HttpClient | null = null;

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