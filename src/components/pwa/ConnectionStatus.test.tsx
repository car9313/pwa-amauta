import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConnectionStatus } from "./ConnectionStatus";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import type { AuthUser } from "@/features/auth/domain/types";

const mockUseOfflineMode = vi.fn();
const mockUseFailedMutationCount = vi.fn();

vi.mock("@/features/auth/hooks/useOfflineMode", () => ({
  useOfflineMode: (...args: unknown[]) => mockUseOfflineMode(...args),
}));

vi.mock("@/hooks/useFailedMutationCount", () => ({
  useFailedMutationCount: (...args: unknown[]) => mockUseFailedMutationCount(...args),
}));

const studentUser: AuthUser = {
  name: "Mario",
  email: "mario@test.com",
  tenantId: "t1",
  role: "student",
  studentId: "stu_001",
};

const parentUser: AuthUser = {
  name: "Ana",
  email: "ana@test.com",
  tenantId: "t1",
  role: "parent",
  parentId: "par_001",
  children: [{ studentId: "stu_001", name: "Mario", level: 2, points: 100, precision: 85, streakDays: 4 }],
};

const mockRetry = vi.fn();
const mockDismiss = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    isAuthenticated: false,
    user: null,
    hasHydrated: false,
    selectedStudentId: null,
    isVerifying: true,
    isOfflineMode: false,
    lastAuthError: null,
  });
  mockUseOfflineMode.mockReturnValue({
    isOnline: true,
    isOfflineMode: false,
    canRetry: false,
  });
  mockUseFailedMutationCount.mockReturnValue({
    count: 0,
    loading: false,
    retry: mockRetry,
    dismiss: mockDismiss,
  });
});

describe("ConnectionStatus", () => {
  describe("visibility", () => {
    it("renders nothing when online and no error", () => {
      const { container } = render(<ConnectionStatus />);
      expect(container.firstChild).toBeNull();
    });

    it("renders banner when offline", () => {
      mockUseOfflineMode.mockReturnValue({ isOnline: false, isOfflineMode: true, errorMessage: null, canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.getByText("Sin conexión a internet")).toBeInTheDocument();
    });

    it("renders auth error banner when lastAuthError is set even if online", () => {
      useAuthStore.setState({ lastAuthError: "NETWORK_ERROR" });
      mockUseOfflineMode.mockReturnValue({ isOnline: true, isOfflineMode: true, canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.getByText("Sin conexión a internet. Puedes seguir usando la app en modo offline.")).toBeInTheDocument();
    });
  });

  describe("messages by role", () => {
    it("shows generic message when no user", () => {
      mockUseOfflineMode.mockReturnValue({ isOnline: false, isOfflineMode: true, errorMessage: null, canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.getByText("Sin conexión a internet")).toBeInTheDocument();
    });

    it("shows student message for student role", () => {
      useAuthStore.setState({ user: studentUser });
      mockUseOfflineMode.mockReturnValue({ isOnline: false, isOfflineMode: true, errorMessage: null, canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.getByText("¡Ups! Algo no funciona. Avísale a un adulto.")).toBeInTheDocument();
    });

    it("shows parent message for parent role", () => {
      useAuthStore.setState({ user: parentUser });
      mockUseOfflineMode.mockReturnValue({ isOnline: false, isOfflineMode: true, errorMessage: null, canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.getByText("Sin conexión a internet. Puedes seguir usando la app en modo offline.")).toBeInTheDocument();
    });

    it("shows auth error message for student when lastAuthError is set", () => {
      useAuthStore.setState({ user: studentUser, lastAuthError: "TIMEOUT" });
      mockUseOfflineMode.mockReturnValue({ isOnline: true, isOfflineMode: true, canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.getByText("La conexión está muy lenta. Inténtalo de nuevo.")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("retry button in offline banner", () => {
    it("shows retry button for parent when lastAuthError", () => {
      useAuthStore.setState({ user: parentUser, lastAuthError: "TOKEN_EXPIRED" });
      mockUseOfflineMode.mockReturnValue({ isOnline: true, isOfflineMode: true, errorMessage: "Sesión expirada", canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
    });

    it("hides retry button for student when lastAuthError", () => {
      useAuthStore.setState({ user: studentUser, lastAuthError: "TOKEN_EXPIRED" });
      mockUseOfflineMode.mockReturnValue({ isOnline: true, isOfflineMode: true, errorMessage: "Sesión expirada", canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows retry button when no user and lastAuthError", () => {
      useAuthStore.setState({ lastAuthError: "TOKEN_EXPIRED" });
      mockUseOfflineMode.mockReturnValue({ isOnline: true, isOfflineMode: true, errorMessage: "Sesión expirada", canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
    });

    it("hides retry button when no lastAuthError even if offline", () => {
      mockUseOfflineMode.mockReturnValue({ isOnline: false, isOfflineMode: true, errorMessage: null, canRetry: true });
      render(<ConnectionStatus />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("failed mutations banner", () => {
    it("shows failed mutations banner when online with failed count > 0", () => {
      useAuthStore.setState({ user: parentUser });
      mockUseFailedMutationCount.mockReturnValue({ count: 2, loading: false, retry: mockRetry, dismiss: mockDismiss });
      render(<ConnectionStatus />);
      expect(screen.getByText("2 cambios no se pudieron guardar")).toBeInTheDocument();
    });

    it("hides failed mutations banner for students", () => {
      useAuthStore.setState({ user: studentUser });
      mockUseFailedMutationCount.mockReturnValue({ count: 2, loading: false, retry: mockRetry, dismiss: mockDismiss });
      render(<ConnectionStatus />);
      expect(screen.queryByText(/cambio/)).not.toBeInTheDocument();
    });

    it("shows singular text for one failed mutation", () => {
      useAuthStore.setState({ user: parentUser });
      mockUseFailedMutationCount.mockReturnValue({ count: 1, loading: false, retry: mockRetry, dismiss: mockDismiss });
      render(<ConnectionStatus />);
      expect(screen.getByText("1 cambio no se pudo guardar")).toBeInTheDocument();
    });

    it("hides failed mutations banner when failed count is 0", () => {
      useAuthStore.setState({ user: parentUser });
      render(<ConnectionStatus />);
      expect(screen.queryByText(/cambio/)).not.toBeInTheDocument();
    });

    it("shows retry button with spinner text when loading", () => {
      useAuthStore.setState({ user: parentUser });
      mockUseFailedMutationCount.mockReturnValue({ count: 1, loading: true, retry: mockRetry, dismiss: mockDismiss });
      render(<ConnectionStatus />);
      expect(screen.getByText("Reintentando...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reintentando/i })).toBeDisabled();
    });

    it("calls retry when retry button is clicked", () => {
      useAuthStore.setState({ user: parentUser });
      mockUseFailedMutationCount.mockReturnValue({ count: 1, loading: false, retry: mockRetry, dismiss: mockDismiss });
      render(<ConnectionStatus />);
      fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));
      expect(mockRetry).toHaveBeenCalledOnce();
    });

    it("calls dismiss when dismiss button is clicked", () => {
      useAuthStore.setState({ user: parentUser });
      mockUseFailedMutationCount.mockReturnValue({ count: 1, loading: false, retry: mockRetry, dismiss: mockDismiss });
      render(<ConnectionStatus />);
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
      fireEvent.click(buttons[1]);
      expect(mockDismiss).toHaveBeenCalledOnce();
    });

    it("shows failed mutations banner when no user and failed count > 0", () => {
      mockUseFailedMutationCount.mockReturnValue({ count: 1, loading: false, retry: mockRetry, dismiss: mockDismiss });
      render(<ConnectionStatus />);
      expect(screen.getByText("1 cambio no se pudo guardar")).toBeInTheDocument();
    });
  });

  describe("both banners simultaneously", () => {
    it("shows both banners when lastAuthError and failedCount > 0", () => {
      useAuthStore.setState({ user: parentUser, lastAuthError: "TOKEN_EXPIRED" });
      mockUseOfflineMode.mockReturnValue({ isOnline: true, isOfflineMode: true, canRetry: true });
      mockUseFailedMutationCount.mockReturnValue({ count: 1, loading: false, retry: mockRetry, dismiss: mockDismiss });
      render(<ConnectionStatus />);
      expect(screen.getByText("Tu sesión expiró. Conéctate a internet para renovarla automáticamente.")).toBeInTheDocument();
      expect(screen.getByText("1 cambio no se pudo guardar")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /reintentar/i })).toHaveLength(2);
    });
  });
});
