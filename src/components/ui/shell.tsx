import { cn } from "@/lib/utils"
import { ConnectionStatus } from "@/components/pwa/ConnectionStatus"
import { AppHeader } from "@/layout/app-header"
import type { ReactNode } from "react"

interface ShellProps {
  children: ReactNode
  className?: string
  distractionFree?: boolean
}

function Shell({ children, className, distractionFree = false }: ShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      {!distractionFree && (
        <>
          <ConnectionStatus />
          <AppHeader />
        </>
      )}
      {children}
    </div>
  )
}

export { Shell }
export type { ShellProps }
