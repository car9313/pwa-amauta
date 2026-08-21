import { useEffect, useState } from "react"

export type Breakpoint = "mobile" | "tablet" | "desktop"

interface UseBreakpointResult {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTabletOrDesktop: boolean
  breakpoint: Breakpoint
}

function resolveBreakpoint(): Breakpoint {
  if (typeof window === "undefined") return "desktop"
  const width = window.innerWidth
  if (width < 768) return "mobile"
  if (width < 1024) return "tablet"
  return "desktop"
}

function useBreakpoint(): UseBreakpointResult {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(resolveBreakpoint)

  useEffect(() => {
    const tabletQuery = window.matchMedia("(min-width: 768px)")
    const desktopQuery = window.matchMedia("(min-width: 1024px)")

    const update = () => {
      setBreakpoint(resolveBreakpoint())
    }

    update()

    if (tabletQuery.addEventListener) {
      tabletQuery.addEventListener("change", update)
      desktopQuery.addEventListener("change", update)
      return () => {
        tabletQuery.removeEventListener("change", update)
        desktopQuery.removeEventListener("change", update)
      }
    }

    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("resize", update)
    }
  }, [])

  return {
    isMobile: breakpoint === "mobile",
    isTablet: breakpoint === "tablet",
    isDesktop: breakpoint === "desktop",
    isTabletOrDesktop: breakpoint !== "mobile",
    breakpoint,
  }
}

export { useBreakpoint }
export type { UseBreakpointResult }
