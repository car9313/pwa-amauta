import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/features/auth/infrastructure/auth-storage", () => ({
  saveAuthResponse: vi.fn().mockResolvedValue(undefined),
  clearAuth: vi.fn().mockResolvedValue(undefined),
  getAccessToken: vi.fn().mockResolvedValue(null),
  getStoredToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/http/client", async () => {
  return {
    HttpError: class HttpError extends Error {
      constructor(
        message: string,
        public statusCode: number,
        public code: string,
        public isOffline: boolean = false
      ) {
        super(message);
        this.name = "HttpError";
      }
    },
    httpClient: { request: vi.fn() },
  };
});

import { authAdapter } from "./adapter";
import { saveAuthResponse } from "@/features/auth/infrastructure/auth-storage";
import { HttpError } from "@/lib/http/client";

const setOnline = (value: boolean): void => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
};

describe("mockAdapter.login (offline behavior)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setOnline(true);
  });

  it("throws HttpError with NETWORK_ERROR code when offline", async () => {
    setOnline(false);

    await expect(
      authAdapter.login({ email: "student@amauta.com", password: "123456" })
    ).rejects.toBeInstanceOf(HttpError);

    await expect(
      authAdapter.login({ email: "student@amauta.com", password: "123456" })
    ).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      isOffline: true,
    });

    expect(saveAuthResponse).not.toHaveBeenCalled();
  });

  it("does not call saveAuthResponse when offline", async () => {
    setOnline(false);
    try {
      await authAdapter.login({ email: "x@x.com", password: "123456" });
    } catch {
      // expected
    }
    expect(saveAuthResponse).not.toHaveBeenCalled();
  });

  it("succeeds and calls saveAuthResponse when online with valid credentials", async () => {
    setOnline(true);
    const result = await authAdapter.login({
      email: "student@amauta.com",
      password: "123456",
    });
    expect(result.user.email).toBe("student@amauta.com");
    expect(saveAuthResponse).toHaveBeenCalledOnce();
  });

  it("throws plain Error for invalid credentials (online)", async () => {
    setOnline(true);
    await expect(
      authAdapter.login({ email: "wrong@amauta.com", password: "123456" })
    ).rejects.toThrow("Credenciales inválidas");
    expect(saveAuthResponse).not.toHaveBeenCalled();
  });

  it("wraps saveAuthResponse errors in HttpError with REFRESH_FAILED", async () => {
    setOnline(true);
    vi.mocked(saveAuthResponse).mockRejectedValueOnce(new Error("Dexie quota"));
    await expect(
      authAdapter.login({ email: "student@amauta.com", password: "123456" })
    ).rejects.toMatchObject({
      name: "HttpError",
    });
  });
});

describe("mockAdapter.register (offline behavior)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setOnline(true);
  });

  it("throws HttpError when offline", async () => {
    setOnline(false);
    await expect(
      authAdapter.register({
        name: "Test",
        email: "new@amauta.com",
        password: "123456",
        confirmPassword: "123456",
        role: "parent",
      })
    ).rejects.toBeInstanceOf(HttpError);
    expect(saveAuthResponse).not.toHaveBeenCalled();
  });
});

describe("mockAdapter.logout (offline behavior)", () => {
  it("does NOT throw when offline (logout should always work locally)", async () => {
    setOnline(false);
    await expect(authAdapter.logout()).resolves.toBeUndefined();
  });
});

describe("mockAdapter.me (offline behavior)", () => {
  it("throws HttpError when offline", async () => {
    setOnline(false);
    await expect(authAdapter.me()).rejects.toBeInstanceOf(HttpError);
  });
});

describe("mockAdapter.addChild (offline behavior)", () => {
  it("throws HttpError when offline", async () => {
    setOnline(false);
    await expect(
      authAdapter.addChild("par_001", {
        name: "Kid",
        email: "k@x.com",
        password: "123456",
      })
    ).rejects.toBeInstanceOf(HttpError);
  });
});
