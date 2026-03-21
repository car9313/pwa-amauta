import { useEffect, useRef, useState } from "react"

interface ParallaxOptions {
  speed?: number // 0 = no parallax, 1 = full parallax
  direction?: "up" | "down"
}

export function useParallax({ speed = 0.3, direction = "up" }: ParallaxOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    let ticking = false

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect()
            const windowHeight = window.innerHeight
            const elementCenter = rect.top + rect.height / 2
            const viewportCenter = windowHeight / 2
            const distanceFromCenter = elementCenter - viewportCenter
            const multiplier = direction === "up" ? -1 : 1
            setOffset(distanceFromCenter * speed * multiplier)
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed, direction])

  return { ref, offset }
}
