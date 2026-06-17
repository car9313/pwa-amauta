import { Suspense } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Container } from "@/components/ui/container"
import { Shell } from "@/components/ui/shell"
import { ErrorBoundary } from "@/components/error"
import { useAuthStore } from "@/features/auth/presentation/store/auth-store"

const LAYOUT_ROUTES = ["/dashboard", "/lessons", "/progress", "/practice", "/games"]

function PageFallback() {
  return (
    <div className="page-loading">
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
      <Shell>
        <Container as="main" className="py-4">
          {showBreadcrumb && (
            <div className="mb-4 sm:mb-6">
              <Breadcrumbs />
            </div>
          )}
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </Container>
      </Shell>
    </ErrorBoundary>
  )
}