import { Suspense } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AppHeader } from "./app-header"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { ErrorBoundary } from "@/components/error"
import { useAuthStore } from "@/features/auth/presentation/store/auth-store"
import { ConnectionStatus } from "@/components/pwa/ConnectionStatus"

const LAYOUT_ROUTES = ["/dashboard", "/lessons", "/progress", "/practice", "/games"]

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export function AmautaLayout() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const showBreadcrumb = LAYOUT_ROUTES.some(route => location.pathname.startsWith(route))

  const layoutFallbackType = user?.role === "student" ? "student" : user?.role === "parent" ? "parent" : "generic"

  return (
    <ErrorBoundary fallbackType={layoutFallbackType}>
      <div className="min-h-screen bg-background text-foreground">
        <ConnectionStatus />
        <AppHeader /> 
        <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {showBreadcrumb && (
            <div className="mb-4 sm:mb-6">
              <Breadcrumbs />
            </div>
          )}
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  )
}