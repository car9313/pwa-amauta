import * as React from "react"
import { Trophy, Star, Target, BarChart3, TrendingUp, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { AmautaStatCard } from "./amauta-stat-card"
import { AmautaGrid } from "./amauta-grid"

interface ChildOverview {
  id: string
  name: string
  avatar?: string
  level: number
  points: number
  accuracy: number
  streakDays: number
}

interface ActivityItem {
  id: string
  childName: string
  action: string
  subject?: string
  timestamp: string
  type: "completed" | "level_up" | "practice"
}

interface ParentMetricsGridProps {
  childrenData: ChildOverview[]
  recentActivity?: ActivityItem[]
  totalPoints?: number
  averageAccuracy?: number
  className?: string
}

const activityIconMap = {
  completed: CheckCircle2,
  level_up: Trophy,
  practice: TrendingUp,
}

const activityColorMap = {
  completed: "text-success",
  level_up: "text-[var(--amauta-orange)]",
  practice: "text-[var(--amauta-blue)]",
}

function ParentMetricsGrid({
  childrenData,
  recentActivity,
  totalPoints,
  averageAccuracy,
  className,
}: ParentMetricsGridProps) {
  const resolvedTotalPoints = totalPoints ?? childrenData.reduce((sum, c) => sum + c.points, 0)
  const resolvedAvgAccuracy = averageAccuracy ?? Math.round(
    childrenData.reduce((sum, c) => sum + c.accuracy, 0) / (childrenData.length || 1)
  )

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AmautaStatCard
          icon={Trophy}
          value={childrenData.length}
          label="Hijos"
          color="primary"
        />
        <AmautaStatCard
          icon={Star}
          value={resolvedTotalPoints}
          label="Puntos Totales"
          color="accent"
        />
        <AmautaStatCard
          icon={Target}
          value={`${resolvedAvgAccuracy}%`}
          label="Precisión Promedio"
          color="success"
          trend={resolvedAvgAccuracy >= 70 ? "up" : resolvedAvgAccuracy >= 40 ? "neutral" : "down"}
          trendValue={`${resolvedAvgAccuracy}%`}
        />
      </div>

      {childrenData.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground">
            Resumen de Hijos
          </h3>
          <AmautaGrid cols={2} gap="md">
            {childrenData.map((child) => (
              <div
                key={child.id}
                className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 hover-lift"
              >
                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-[var(--amauta-blue)]/5 blur-2xl opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-150 pointer-events-none" />

                <div className="relative z-10 flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    <img
                      src={child.avatar ?? "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop"}
                      alt={child.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground truncate">
                      {child.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Nivel {child.level}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--amauta-orange)]">
                      {child.points}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      puntos
                    </p>
                  </div>
                </div>

                <div className="relative z-10 mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {child.accuracy}% precisión
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-[var(--amauta-orange)]" />
                    {child.streakDays} días racha
                  </span>
                </div>
              </div>
            ))}
          </AmautaGrid>
        </div>
      )}

      {recentActivity && recentActivity.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground">
            Actividad Reciente
          </h3>
          <div className="space-y-2">
            {recentActivity.map((item) => {
              const Icon = activityIconMap[item.type] || TrendingUp
              const iconColor = activityColorMap[item.type] || "text-muted-foreground"
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 transition-all hover:bg-muted"
                >
                  <div className={cn("mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white", iconColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      <span className="font-bold">{item.childName}</span> — {item.action}
                    </p>
                    {item.subject && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.subject}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.timestamp}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export { ParentMetricsGrid }
export type { ParentMetricsGridProps, ChildOverview, ActivityItem }
