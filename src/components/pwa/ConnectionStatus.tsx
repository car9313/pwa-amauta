import { useEffect, useRef, useState } from "react"
import { WifiOff, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"
import { triggerSync, getQueueState } from "@/lib/sync/queue-manager"
import { usePendingMutations } from "@/lib/sync/useOfflineMutation"

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== "undefined" ? navigator.onLine : true)
  const [showStatus, setShowStatus] = useState<boolean>(false)
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false)
  const timeoutRef = useRef<number | null>(null)
  const { pendingCount } = usePendingMutations()

  useEffect(() => {
    if (typeof navigator === "undefined") return

    const handleOnline = async () => {
      setIsOnline(true)
      setShowStatus(true)

      try {
        const state = await getQueueState()
        if (state.pendingCount > 0 && !state.isSyncing) {
          setSyncInProgress(true)
          await triggerSync()
          setSyncInProgress(false)
        }
      } catch (err) {
        console.warn("triggerSync failed:", err)
        setSyncInProgress(false)
      }

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

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!showStatus && isOnline) return null

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
          {pendingCount > 0 && (
            <span className="text-xs opacity-80">({pendingCount} pendientes)</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Sin conexión a internet</span>
        </>
      )}
      {isOnline && pendingCount > 0 && !syncInProgress && (
        <button
          onClick={async () => {
            setSyncInProgress(true)
            await triggerSync()
            setSyncInProgress(false)
          }}
          className="ml-2 text-xs underline"
          aria-label="Reintentar sincronización"
        >
          Sincronizar
        </button>
      )}
      {syncInProgress && (
        <span className="text-xs animate-pulse">Sincronizando...</span>
      )}
    </div>
  )
}