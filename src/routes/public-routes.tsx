import type { RouteObject } from "react-router-dom";
import { PublicLayout } from "@/layout/public-layout";
import RegisterPage from "@/features/auth/pages/register-page";
import { LoginPage } from "@/features/auth/pages/login-page";

export const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
  ],
};