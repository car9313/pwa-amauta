import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RequireAuth } from "./require-auth";
import { RequireRole } from "./require-role";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import type { AuthUser } from "@/features/auth/domain/types";

vi.mock("react-router-dom", () => ({
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
    <div data-testid="navigate-to" data-replace={replace ? "true" : "false"}>{to}</div>
  ),
}));

vi.mock("@/features/auth/presentation/routing/auth-navigation", () => ({
  getDashboardPath: (role: string) => `/dashboard/${role}`,
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
  children: [{ studentId: "stu_001", name: "Mario", level: 2, points: 100, precision: 85, streakDays: 4 }],
};

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
});

describe("RequireAuth", () => {
  it("returns null when not hydrated", () => {
    const { container } = render(
      <RequireAuth><div>Protected</div></RequireAuth>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("redirects to /login with replace when not authenticated", () => {
    useAuthStore.setState({ hasHydrated: true, isAuthenticated: false });
    render(<RequireAuth><div>Protected</div></RequireAuth>);
    const nav = screen.getByTestId("navigate-to");
    expect(nav).toHaveTextContent("/login");
    expect(nav).toHaveAttribute("data-replace", "true");
  });

  it("renders children when authenticated", () => {
    useAuthStore.setState({ hasHydrated: true, isAuthenticated: true, user: mockStudent });
    render(<RequireAuth><div>Protected</div></RequireAuth>);
    expect(screen.getByText("Protected")).toBeInTheDocument();
  });
});

describe("RequireRole", () => {
  it("redirects to /roles when user is null", () => {
    render(<RequireRole allowedRole="student"><div>Content</div></RequireRole>);
    const nav = screen.getByTestId("navigate-to");
    expect(nav).toHaveTextContent("/roles");
    expect(nav).toHaveAttribute("data-replace", "true");
  });

  it("redirects to role dashboard when role does not match", () => {
    useAuthStore.setState({ user: mockStudent });
    render(<RequireRole allowedRole="parent"><div>Parent content</div></RequireRole>);
    const nav = screen.getByTestId("navigate-to");
    expect(nav).toHaveTextContent("/dashboard/student");
  });

  it("renders children when role matches", () => {
    useAuthStore.setState({ user: mockStudent });
    render(<RequireRole allowedRole="student"><div>Student content</div></RequireRole>);
    expect(screen.getByText("Student content")).toBeInTheDocument();
  });

  it("redirects parent to their dashboard when accessing student route", () => {
    useAuthStore.setState({ user: mockParent });
    render(<RequireRole allowedRole="student"><div>Student content</div></RequireRole>);
    expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard/parent");
  });
});
