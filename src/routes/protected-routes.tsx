import type { RouteObject } from "react-router-dom";
import { RequireRole } from "./guards/require-role";
import { RoleSelectionPage } from "@/features/role/pages/role-selection-page";
import { AmautaLayout } from "@/layout/amauta-layout";
import { LevelScreen } from "@/features/progress/pages/level-screen";
import { LessonScreen } from "@/features/lessons/pages/lesson-page";
import { RequireAuth } from "./guards/require-auth";
import { HomeRedirect } from "./home-redirect";
import { ParentDashboardPage } from "@/features/dashboard/pages/parent-dashboard-page";
import { StudentDashboardPage } from '@/features/dashboard/pages/student-dashboard-page';

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
      path: "/lessons",
      element: <LessonScreen />,
    },
    {
      path: "/progress",
      element: <LevelScreen />,
    }
  ],
};