import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { publicRoutes } from "./public-routes";
import { protectedRoutes } from "./protected-routes";

const routes: RouteObject[] = [
  publicRoutes,
  protectedRoutes,
 { path: "*", element: <Navigate to="/login" replace /> },
];

export function AppRoutes() {
  return useRoutes(routes);
}