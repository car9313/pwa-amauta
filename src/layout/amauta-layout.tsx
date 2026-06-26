import { Suspense } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AmautaBreadcrumbs, AmautaContainer } from "@/components/amauta"
import { Shell } from "@/components/ui/shell"
import { ErrorBoundary } from "@/components/error"
import { AmautaLoadingState } from "@/components/amauta"
import { useAuthStore } from "@/features/auth/presentation/store/auth-store"

const LAYOUT_ROUTES = ["/dashboard", "/lessons", "/progress", "/practice", "/games"]

function PageFallback() {
  return <AmautaLoadingState variant="page" />;
}

export function AmautaLayout() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const showBreadcrumb = LAYOUT_ROUTES.some(route => location.pathname.startsWith(route))

  const layoutFallbackType = user?.role === "student" ? "student" : user?.role === "parent" ? "parent" : "generic"

  return (
    <ErrorBoundary fallbackType={layoutFallbackType}>
      <Shell>
        <AmautaContainer as="main" className="py-4">
          {showBreadcrumb && <AmautaBreadcrumbs />}
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </AmautaContainer>
      </Shell>
    </ErrorBoundary>
  )
}