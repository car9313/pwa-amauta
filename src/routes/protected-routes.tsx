import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { RequireRole } from "./guards/require-role";
import { AmautaLayout } from "@/layout/amauta-layout";
import { RequireAuth } from "./guards/require-auth";
import { HomeRedirect } from "./home-redirect";

const RoleSelectionPage = lazy(() =>
  import("@/features/role/pages/role-selection-page").then((m) => ({
    default: m.RoleSelectionPage,
  }))
);
const LevelScreen = lazy(() =>
  import("@/features/progress/pages/level-screen").then((m) => ({
    default: m.LevelScreen,
  }))
);
const LessonPage = lazy(() =>
  import("@/features/lessons/pages/lesson-page").then((m) => ({
    default: m.LessonPage,
  }))
);
const FeedbackPage = lazy(() =>
  import("@/features/lessons/pages/feedback-page").then((m) => ({
    default: m.FeedbackPage,
  }))
);
const PracticePage = lazy(() =>
  import("@/features/practice/pages/practice-page").then((m) => ({
    default: m.PracticePage,
  }))
);
const GamesPage = lazy(() =>
  import("@/features/games/pages/games-page").then((m) => ({
    default: m.GamesPage,
  }))
);
const ParentDashboardPage = lazy(() =>
  import("@/features/dashboard/pages/parent-dashboard-page").then((m) => ({
    default: m.ParentDashboardPage,
  }))
);
const StudentDashboardPage = lazy(() =>
  import("@/features/dashboard/pages/student-dashboard-page").then((m) => ({
    default: m.StudentDashboardPage,
  }))
);
const TeacherDashboardPage = lazy(() =>
  import("@/features/dashboard/pages/teacher-dashboard-page").then((m) => ({
    default: m.TeacherDashboardPage,
  }))
);

export const protectedRoutes: RouteObject = {
  element: (
    <RequireAuth>
      <AmautaLayout />
    </RequireAuth>
  ),
  children: [
    { path: "/", element: <HomeRedirect /> },
    { path: "/dashboard", element: <HomeRedirect /> },
    {
      path: "/roles",
      element: <RoleSelectionPage />,
    },
    {
      path: "/dashboard/student",
      element: (
        <RequireRole allowedRole="student">
          <StudentDashboardPage />
        </RequireRole>
      ),
    },
    {
      path: "/dashboard/parent",
      element: (
        <RequireRole allowedRole="parent">
          <ParentDashboardPage />
        </RequireRole>
      ),
    },
    {
      path: "/dashboard/teacher",
      element: (
        <RequireRole allowedRole="teacher">
          <TeacherDashboardPage />
        </RequireRole>
      ),
    },
    {
      path: "/lessons",
      element: <LessonPage />,
    },
    {
      path: "/lessons/feedback",
      element: <FeedbackPage />,
    },
    {
      path: "/progress",
      element: <LevelScreen />,
    },
    {
      path: "/practice",
      element: <PracticePage />,
    },
    {
      path: "/games",
      element: <GamesPage />,
    },
  ],
};