import * as React from "react"

import { cn } from "@/lib/utils"

type AmautaLoadingVariant = "page" | "card" | "text" | "avatar" | "stat"

interface AmautaLoadingStateProps {
  variant?: AmautaLoadingVariant
  count?: number
  className?: string
  label?: string
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[var(--amauta-blue-light)]/60",
        className
      )}
    />
  )
}

function PageSkeleton() {
  return (
    <div className="page-loading flex-col gap-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[var(--amauta-orange)]/20 animate-ping" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--amauta-orange)]/30">
          <svg
            className="h-8 w-8 text-[var(--amauta-orange)] animate-sparkle"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Cargando...
      </p>
    </div>
  )
}

function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-3 w-1/2" />
            </div>
          </div>
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-5/6" />
          <SkeletonBlock className="h-8 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

function TextSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          {i < count - 1 && <SkeletonBlock className="h-4 w-4/6" />}
        </div>
      ))}
    </div>
  )
}

function AvatarSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <SkeletonBlock className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
    </div>
  )
}

function StatSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4"
        >
          <SkeletonBlock className="h-12 w-12 rounded-xl" />
          <SkeletonBlock className="h-6 w-16" />
          <SkeletonBlock className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

const variantComponents: Record<AmautaLoadingVariant, React.FC<{ count?: number }>> = {
  page: PageSkeleton,
  card: CardSkeleton,
  text: TextSkeleton,
  avatar: AvatarSkeleton,
  stat: StatSkeleton,
}

function AmautaLoadingState({
  variant = "page",
  count = 1,
  className,
  label,
}: AmautaLoadingStateProps) {
  const Component = variantComponents[variant]

  return (
    <div className={cn(className)} role="status" aria-live="polite">
      <Component count={count} />
      {label && (
        <p className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
          {label}
        </p>
      )}
      <span className="sr-only">Cargando...</span>
    </div>
  )
}

export { AmautaLoadingState }
export type { AmautaLoadingStateProps, AmautaLoadingVariant }
