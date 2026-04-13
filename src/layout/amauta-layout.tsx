import { Outlet, useLocation } from "react-router-dom"
import { AppHeader } from "./app-header"
import { Breadcrumbs } from "@/components/ui/breadcrumb"

const LAYOUT_ROUTES = ["/dashboard", "/lessons", "/progress"]

export function AmautaLayout() {
  const location = useLocation()
  const showBreadcrumb = LAYOUT_ROUTES.some(route => location.pathname.startsWith(route))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader /> 
      <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {showBreadcrumb && (
          <div className="mb-4 sm:mb-6">
            <Breadcrumbs />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}