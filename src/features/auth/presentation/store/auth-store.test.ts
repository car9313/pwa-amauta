import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "./auth-store";
import type { AuthUser } from "@/features/auth/domain/types";

const mockAuthStorage = {
  loadAuthFromStorage: vi.fn(),
  checkAuthValidity: vi.fn(),
  clearAuth: vi.fn(),
  saveSelectedStudentId: vi.fn(),
  getSelectedStudentId: vi.fn(),
  clearSelectedStudentId: vi.fn(),
};

vi.mock("@/features/auth/infrastructure/auth-storage", () => ({
  loadAuthFromStorage: (...args: unknown[]) => mockAuthStorage.loadAuthFromStorage(...args),
  checkAuthValidity: (...args: unknown[]) => mockAuthStorage.checkAuthValidity(...args),
  clearAuth: (...args: unknown[]) => mockAuthStorage.clearAuth(...args),
  saveSelectedStudentId: (...args: unknown[]) => mockAuthStorage.saveSelectedStudentId(...args),
  getSelectedStudentId: (...args: unknown[]) => mockAuthStorage.getSelectedStudentId(...args),
  clearSelectedStudentId: (...args: unknown[]) => mockAuthStorage.clearSelectedStudentId(...args),
}));

const mockStudent: AuthUser = {
  name: "Mario",
  email: "mario@test.com",
  tenantId: "t1",
  role: "student",
  studentId: "stu_001",
};

const mockParent: AuthUser = {
  name: "Ana",
  email: "ana@test.com",
  tenantId: "t1",
  role: "parent",
  parentId: "par_001",
  children: [
    { studentId: "stu_001", name: "Mario", level: 2, points: 100, precision: 85, streakDays: 4 },
    { studentId: "stu_002", name: "Lucía", level: 3, points: 200, precision: 92, streakDays: 7 },
  ],
};

const mockTeacher: AuthUser = {
  name: "Carlos",
  email: "carlos@test.com",
  tenantId: "t1",
  role: "teacher",
  teacherId: "tea_001",
  classIds: ["cls_001"],
};

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: false,
    user: null,
    hasHydrated: false,
    selectedStudentId: null,
    isVerifying: true,
    isOfflineMode: false,
    lastAuthError: null,
  });
  vi.clearAllMocks();
});

describe("initial state", () => {
  it("has correct default values", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.hasHydrated).toBe(false);
    expect(state.selectedStudentId).toBeNull();
    expect(state.isVerifying).toBe(true);
    expect(state.isOfflineMode).toBe(false);
    expect(state.lastAuthError).toBeNull();
  });
});

describe("setUser", () => {
  it("sets user and marks authenticated", () => {
    useAuthStore.getState().setUser(mockStudent);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockStudent);
    expect(state.isAuthenticated).toBe(true);
    expect(state.selectedStudentId).toBeNull();
  });

  it("clears user and unauthenticates when null", () => {
    useAuthStore.getState().setUser(mockStudent);
    useAuthStore.getState().setUser(null);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

describe("clearSession", () => {
  it("clears all auth state and calls clearAuth", async () => {
    useAuthStore.setState({ user: mockStudent, isAuthenticated: true, hasHydrated: true });
    await useAuthStore.getState().clearSession();
    const state = useAuthStore.getState();
    expect(mockAuthStorage.clearAuth).toHaveBeenCalledOnce();
    expect(mockAuthStorage.clearSelectedStudentId).toHaveBeenCalledOnce();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isOfflineMode).toBe(false);
    expect(state.lastAuthError).toBeNull();
  });
});

describe("selectStudent", () => {
  it("returns false for student role", () => {
    useAuthStore.setState({ user: mockStudent });
    expect(useAuthStore.getState().selectStudent("any")).toBe(false);
  });

  it("returns false if studentId not in children", () => {
    useAuthStore.setState({ user: mockParent });
    expect(useAuthStore.getState().selectStudent("unknown")).toBe(false);
  });

  it("selects valid child for parent", () => {
    useAuthStore.setState({ user: mockParent });
    const result = useAuthStore.getState().selectStudent("stu_001");
    expect(result).toBe(true);
    expect(useAuthStore.getState().selectedStudentId).toBe("stu_001");
    expect(mockAuthStorage.saveSelectedStudentId).toHaveBeenCalledWith("stu_001");
  });

  it("switches to another child", () => {
    useAuthStore.setState({ user: mockParent, selectedStudentId: "stu_001" });
    const result = useAuthStore.getState().selectStudent("stu_002");
    expect(result).toBe(true);
    expect(useAuthStore.getState().selectedStudentId).toBe("stu_002");
  });
});

describe("clearSelectedStudent", () => {
  it("clears selection and calls storage", () => {
    useAuthStore.setState({ selectedStudentId: "stu_001" });
    useAuthStore.getState().clearSelectedStudent();
    expect(useAuthStore.getState().selectedStudentId).toBeNull();
    expect(mockAuthStorage.clearSelectedStudentId).toHaveBeenCalledOnce();
  });
});

describe("hydrateFromStorage", () => {
  it("sets hydrated false when validity check fails", async () => {
    mockAuthStorage.checkAuthValidity.mockResolvedValue(false);
    await useAuthStore.getState().hydrateFromStorage();
    const state = useAuthStore.getState();
    expect(state.hasHydrated).toBe(true);
    expect(state.isVerifying).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(mockAuthStorage.clearAuth).toHaveBeenCalled();
  });

  it("restores user from storage when valid", async () => {
    mockAuthStorage.checkAuthValidity.mockResolvedValue(true);
    mockAuthStorage.loadAuthFromStorage.mockResolvedValue({ user: mockStudent });
    mockAuthStorage.getSelectedStudentId.mockResolvedValue(null);
    await useAuthStore.getState().hydrateFromStorage();
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockStudent);
    expect(state.isAuthenticated).toBe(true);
    expect(state.hasHydrated).toBe(true);
    expect(state.isVerifying).toBe(false);
  });

  it("restores selectedStudentId when present", async () => {
    mockAuthStorage.checkAuthValidity.mockResolvedValue(true);
    mockAuthStorage.loadAuthFromStorage.mockResolvedValue({ user: mockParent });
    mockAuthStorage.getSelectedStudentId.mockResolvedValue("stu_002");
    await useAuthStore.getState().hydrateFromStorage();
    expect(useAuthStore.getState().selectedStudentId).toBe("stu_002");
  });

  it("handles null stored data gracefully", async () => {
    mockAuthStorage.checkAuthValidity.mockResolvedValue(true);
    mockAuthStorage.loadAuthFromStorage.mockResolvedValue(null);
    mockAuthStorage.getSelectedStudentId.mockResolvedValue(null);
    await useAuthStore.getState().hydrateFromStorage();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.hasHydrated).toBe(true);
  });
});

describe("setOfflineMode / setAuthError", () => {
  it("sets offline mode", () => {
    useAuthStore.getState().setOfflineMode(true);
    expect(useAuthStore.getState().isOfflineMode).toBe(true);
    useAuthStore.getState().setOfflineMode(false);
    expect(useAuthStore.getState().isOfflineMode).toBe(false);
  });

  it("sets auth error", () => {
    useAuthStore.getState().setAuthError("NETWORK_ERROR");
    expect(useAuthStore.getState().lastAuthError).toBe("NETWORK_ERROR");
    useAuthStore.getState().setAuthError(null);
    expect(useAuthStore.getState().lastAuthError).toBeNull();
  });
});

describe("handleAuthFailure", () => {
  describe("TOKEN_REVOKED and SESSION_NOT_FOUND", () => {
    it("clears session on TOKEN_REVOKED", async () => {
      useAuthStore.setState({ user: mockStudent, hasHydrated: true });
      await useAuthStore.getState().handleAuthFailure("TOKEN_REVOKED");
      expect(mockAuthStorage.clearAuth).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("clears session on SESSION_NOT_FOUND", async () => {
      useAuthStore.setState({ user: mockStudent, hasHydrated: true });
      await useAuthStore.getState().handleAuthFailure("SESSION_NOT_FOUND");
      expect(mockAuthStorage.clearAuth).toHaveBeenCalled();
    });
  });

  describe("offline errors with local session", () => {
    it.each(["NETWORK_ERROR", "TOKEN_EXPIRED", "REFRESH_FAILED", "TIMEOUT"] as const)("sets offline mode for %s", async (error) => {
      useAuthStore.setState({ user: mockStudent, hasHydrated: true });
      await useAuthStore.getState().handleAuthFailure(error);
      const state = useAuthStore.getState();
      expect(state.isOfflineMode).toBe(true);
      expect(state.lastAuthError).toBe(error);
      expect(mockAuthStorage.clearAuth).not.toHaveBeenCalled();
    });
  });

  describe("offline errors without local session", () => {
    it.each(["NETWORK_ERROR", "TOKEN_EXPIRED", "REFRESH_FAILED", "TIMEOUT"] as const)("clears session for %s when no session", async (error) => {
      useAuthStore.setState({ user: null, hasHydrated: false });
      await useAuthStore.getState().handleAuthFailure(error);
      expect(mockAuthStorage.clearAuth).toHaveBeenCalled();
    });
  });

  describe("TOKEN_INVALID", () => {
    it("clears session when TOKEN_INVALID with local session", async () => {
      useAuthStore.setState({ user: mockStudent, hasHydrated: true });
      await useAuthStore.getState().handleAuthFailure("TOKEN_INVALID");
      expect(mockAuthStorage.clearAuth).toHaveBeenCalled();
    });

    it("clears session when TOKEN_INVALID without local session", async () => {
      await useAuthStore.getState().handleAuthFailure("TOKEN_INVALID");
      expect(mockAuthStorage.clearAuth).toHaveBeenCalled();
    });
  });
});
