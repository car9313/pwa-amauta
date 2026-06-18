import * as React from "react"

import { cn } from "@/lib/utils"

type AmautaAnimationType = "fade-in-up" | "scale-in" | "slide-in-right" | "count-up"
type AmautaTransitionOrder = "forward" | "reverse"

interface AmautaTransitionContextValue {
  baseIndex: number
  staggerMs: number
  animation: AmautaAnimationType
  order: AmautaTransitionOrder
}

const AmautaTransitionContext = React.createContext<AmautaTransitionContextValue | null>(null)

interface AmautaTransitionProps {
  children: React.ReactNode
  className?: string
  animation?: AmautaAnimationType
  stagger?: number
  order?: AmautaTransitionOrder
}

const animationClass: Record<AmautaAnimationType, string> = {
  "fade-in-up": "animate-fade-in-up",
  "scale-in": "animate-scale-in",
  "slide-in-right": "animate-slide-in-right",
  "count-up": "animate-count-up",
}

function AmautaTransition({
  children,
  className,
  animation = "fade-in-up",
  stagger = 0,
  order = "forward",
}: AmautaTransitionProps) {
  const ctx = React.useContext(AmautaTransitionContext)
  const baseIndex = ctx?.baseIndex ?? 0
  const resolvedStagger = ctx?.staggerMs ?? stagger

  if (resolvedStagger > 0) {
    const childrenArray = React.Children.toArray(children)
    const total = childrenArray.length
    const step = total > 1 ? resolvedStagger / Math.max(total - 1, 1) : 0

    return (
      <AmautaTransitionContext.Provider
        value={{ baseIndex: baseIndex + total, staggerMs: resolvedStagger, animation, order }}
      >
        <div className={cn(className)}>
          {childrenArray.map((child, index) => {
            const delay = order === "reverse"
              ? Math.round(resolvedStagger - step * index)
              : Math.round(step * index)

            return (
              <div
                key={index}
                className={animationClass[animation]}
                style={{ animationDelay: `${delay}ms` }}
              >
                {child}
              </div>
            )
          })}
        </div>
      </AmautaTransitionContext.Provider>
    )
  }

  return (
    <AmautaTransitionContext.Provider
      value={{ baseIndex: baseIndex + 1, staggerMs: 0, animation, order }}
    >
      <div className={cn(animationClass[animation], className)}>
        {children}
      </div>
    </AmautaTransitionContext.Provider>
  )
}

interface AmautaTransitionItemProps {
  children: React.ReactNode
  className?: string
  index?: number
  animation?: AmautaAnimationType
}

function AmautaTransitionItem({
  children,
  className,
  index,
  animation,
}: AmautaTransitionItemProps) {
  const ctx = React.useContext(AmautaTransitionContext)
  const resolvedAnimation = animation ?? ctx?.animation ?? "fade-in-up"
  const delay = index !== undefined && ctx
    ? ctx.order === "reverse"
      ? Math.round(ctx.staggerMs - (ctx.staggerMs / Math.max(ctx.baseIndex, 1)) * index)
      : Math.round((ctx.staggerMs / Math.max(ctx.baseIndex, 1)) * index)
    : 0

  return (
    <div
      className={cn(animationClass[resolvedAnimation], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export { AmautaTransition, AmautaTransitionItem }
export type { AmautaTransitionProps, AmautaTransitionItemProps, AmautaAnimationType, AmautaTransitionOrder }
