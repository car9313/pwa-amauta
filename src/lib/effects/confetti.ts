import confetti from "canvas-confetti"

const AMAUTA_COLORS = ["#F97316", "#FBBF24", "#3B82F6", "#22C55E", "#EC4899"]

const FORCE_CONFETTI = import.meta.env.VITE_FORCE_CONFETTI === "true"

let warnedSuppressed = false

const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

const isConfettiSuppressed = (): boolean => {
  if (!prefersReducedMotion() || FORCE_CONFETTI) return false
  if (import.meta.env.DEV && !warnedSuppressed) {
    warnedSuppressed = true
    console.warn(
      "[confetti] Animacion suprimida: el sistema tiene prefers-reduced-motion activo. " +
        "Para forzar confetti en desarrollo, agrega VITE_FORCE_CONFETTI=true a .env.development"
    )
  }
  return true
}

export const fireCorrectBurst = () => {
  if (isConfettiSuppressed()) return
  try {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: AMAUTA_COLORS,
      disableForReducedMotion: !FORCE_CONFETTI,
    })
  } catch {
    return
  }
}

export const fireLessonCelebration = (perfect = false) => {
  if (isConfettiSuppressed()) return

  try {
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: AMAUTA_COLORS,
      disableForReducedMotion: !FORCE_CONFETTI,
    })

    const durationMs = perfect ? 1600 : 800
    const end = Date.now() + durationMs

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        startVelocity: 55,
        origin: { x: 0, y: 0.7 },
        colors: AMAUTA_COLORS,
        disableForReducedMotion: !FORCE_CONFETTI,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        startVelocity: 55,
        origin: { x: 1, y: 0.7 },
        colors: AMAUTA_COLORS,
        disableForReducedMotion: !FORCE_CONFETTI,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  } catch {
    return
  }
}
