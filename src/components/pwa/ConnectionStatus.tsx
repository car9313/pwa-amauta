import { useEffect, useRef, useState } from "react"
import { WifiOff, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"
import { processQueue } from '@/shared/services/syncService';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== "undefined" ? navigator.onLine : true)
  const [showStatus, setShowStatus] = useState<boolean>(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    // protección SSR: navigator existe sólo en cliente
    if (typeof navigator === "undefined") return

    const handleOnline = async () => {
      setIsOnline(true)
      setShowStatus(true)

      // Intentar procesar la cola offline (si existe)
      try {
        // processQueue puede ser async y manejar retries/backoff internamente
        if (typeof processQueue === "function") await processQueue()
      } catch (err) {
        // opcional: log o notificación de fallo en sync
        console.warn("processQueue failed:", err)
      }

      // mostrar mensaje breve y ocultarlo
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        setShowStatus(false)
        timeoutRef.current = null
      }, 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    // Inicializar
    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  // No mostrar nada si estamos online y no queremos mostrar estado
  if (!showStatus && isOnline) return null

  // Respectar prefers-reduced-motion (tailwind: motion-safe/motion-reduce)
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-all duration-500",
        isOnline ? "bg-primary text-white" : "bg-destructive text-white"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>¡De vuelta en línea!</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Sin conexión a internet</span>
        </>
      )}
      {/* Botón opcional para reintentar sincronización manual (útil para padres) */}
      {!isOnline ? null : (
        <button
          onClick={() => { if (typeof processQueue === "function") processQueue().catch(() => {}) }}
          className="ml-2 text-xs underline"
          aria-label="Reintentar sincronización"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}