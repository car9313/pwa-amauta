import type { RouteObject } from "react-router-dom";
import { PublicLayout } from "@/layout/public-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";

export const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
  ],
};