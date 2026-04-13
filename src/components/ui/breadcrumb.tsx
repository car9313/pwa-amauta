"use client"

import { Link, useLocation } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  path?: string
}

const ROUTE_MAP: Record<string, string> = {
  "": "",
  "dashboard": "Dashboard",
  "student": "",
  "lessons": "Lecciones",
  "progress": "Mi Progreso",
  "roles": "Seleccionar Rol",
  "register": "Registrarse",
  "login": "Iniciar Sesión",
}

const EXCLUDED_ROUTES = ["/", "/login", "/register", "/roles"]

export function Breadcrumbs() {
  const location = useLocation()
  const pathSegments = location.pathname.split("/").filter(Boolean)

  if (EXCLUDED_ROUTES.includes(location.pathname)) {
    return null
  }

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: "Inicio", path: "/" }]
    
    let currentPath = ""
    for (const segment of pathSegments) {
      currentPath += `/${segment}`
      
      const label = ROUTE_MAP[segment]
      if (label && currentPath !== "/") {
        items.push({
          label,
          path: currentPath,
        })
      }
    }
    
    return items
  }

  const breadcrumbs = buildBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1

        if (isLast) {
          return (
            <span
              key={item.path ?? index}
              className="font-semibold text-[#1f4fa3]"
            >
              {item.label}
            </span>
          )
        }

        return (
          <div key={item.path ?? index} className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to={item.path ?? "/"}
              className="flex items-center gap-1 text-slate-500 hover:text-[#1f4fa3] transition-colors group"
            >
              {index === 0 ? (
                <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-300" />
              )}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
            {index < breadcrumbs.length - 2 && (
              <ChevronRight className="h-3 w-3 text-slate-300" />
            )}
          </div>
        )
      })}
    </nav>
  )
}