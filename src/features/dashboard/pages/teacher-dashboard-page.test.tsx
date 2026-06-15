import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeacherDashboardPage } from "./teacher-dashboard-page";
import type { TeacherDashboard } from "@/features/exercises/domain/exercise.types";
import type { UseQueryResult } from "@tanstack/react-query";

const mockDashboard: TeacherDashboard = {
  teacherId: "tea_001",
  name: "Prof. Roberto",
  totalStudents: 28,
  totalClasses: 2,
  averageMastery: 74,
  classes: [
    {
      classId: "cls_001",
      className: "3º Primaria A",
      studentCount: 3,
      averageMastery: 78,
      students: [
        { studentId: "s1", name: "Mario", level: 2, points: 156, precision: 85, streakDays: 4, mastery: 78, riskFlags: [], lastActivity: "Hoy" },
        { studentId: "s2", name: "Lucía", level: 3, points: 234, precision: 92, streakDays: 7, mastery: 88, riskFlags: [], lastActivity: "Hoy" },
        { studentId: "s3", name: "Sofía", level: 1, points: 89, precision: 55, streakDays: 1, mastery: 45, riskFlags: ["bajo rendimiento"], lastActivity: "Hace 3 días" },
      ],
    },
  ],
  subjectProgress: [
    { topicId: "math", title: "Matemáticas", mastery: 78 },
    { topicId: "spanish", title: "Español", mastery: 82 },
  ],
  recentActivity: [
    { id: "a1", studentId: "s2", childName: "Lucía", action: "Completó lección", subject: "Fracciones", timestamp: "Hace 15 minutos" },
  ],
};

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useTeacherDashboard: vi.fn(),
}));

import { useTeacherDashboard } from "@/features/auth/hooks/useAuth";

const mockQueryResult = (overrides: Partial<UseQueryResult<TeacherDashboard, Error>>): UseQueryResult<TeacherDashboard, Error> =>
  ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }) as UseQueryResult<TeacherDashboard, Error>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeacherDashboardPage", () => {
  it("shows loading spinner", () => {
    vi.mocked(useTeacherDashboard).mockReturnValue(mockQueryResult({ isLoading: true }));
    const { container } = render(<TeacherDashboardPage />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });

  it("shows error state", () => {
    vi.mocked(useTeacherDashboard).mockReturnValue(mockQueryResult({ isError: true, error: new Error("Error de red") }));
    render(<TeacherDashboardPage />);
    expect(screen.getByText("¡Ups! Algo salió mal")).toBeDefined();
    expect(screen.getByText("Intentar de nuevo")).toBeDefined();
  });

  it("renders teacher name in header", () => {
    vi.mocked(useTeacherDashboard).mockReturnValue(mockQueryResult({ data: mockDashboard }));
    render(<TeacherDashboardPage />);
    expect(screen.getByText("Prof. Roberto")).toBeDefined();
  });

  it("renders stats cards", () => {
    vi.mocked(useTeacherDashboard).mockReturnValue(mockQueryResult({ data: mockDashboard }));
    render(<TeacherDashboardPage />);
    expect(screen.getByText("28")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("74%")).toBeDefined();
  });

  it("renders class names", () => {
    vi.mocked(useTeacherDashboard).mockReturnValue(mockQueryResult({ data: mockDashboard }));
    render(<TeacherDashboardPage />);
    expect(screen.getByText("3º Primaria A")).toBeDefined();
  });

  it("renders student names within classes", () => {
    vi.mocked(useTeacherDashboard).mockReturnValue(mockQueryResult({ data: mockDashboard }));
    render(<TeacherDashboardPage />);
    expect(screen.getByText("Mario")).toBeDefined();
    expect(screen.getAllByText("Lucía").length).toBeGreaterThan(0);
  });

  it("renders subject progress", () => {
    vi.mocked(useTeacherDashboard).mockReturnValue(mockQueryResult({ data: mockDashboard }));
    render(<TeacherDashboardPage />);
    expect(screen.getByText("Matemáticas")).toBeDefined();
    expect(screen.getByText("Español")).toBeDefined();
  });

  it("shows students at risk section", () => {
    vi.mocked(useTeacherDashboard).mockReturnValue(mockQueryResult({ data: mockDashboard }));
    render(<TeacherDashboardPage />);
    expect(screen.getByText("Estudiantes que Requieren Atención")).toBeDefined();
  });
});
