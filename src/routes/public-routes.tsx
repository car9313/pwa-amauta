import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { PublicLayout } from "@/layout/public-layout";

const LoginPage = lazy(() =>
  import("@/features/auth/presentation/pages/login-page").then((m) => ({
    default: m.LoginPage,
  }))
);
const RegisterPage = lazy(() =>
  import("@/features/auth/presentation/pages/register-page").then((m) => ({
    default: m.RegisterPage,
  }))
);

export const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
  ],
};