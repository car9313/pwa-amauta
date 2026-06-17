import { useState } from "react"
import { CheckCircle2, ChevronRight, TrendingUp, Sparkles, HelpCircle, Trophy, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useParentDashboard } from "@/features/auth/hooks/useAuth"
import { cn } from "@/lib/utils"
import { useStagger } from "@/hooks/useStagger"



export function ParentDashboardPage() {
  const { data: dashboard, isLoading, isError, error, refetch } = useParentDashboard();
  const stagger = useStagger({ count: 4, baseDelay: 50, totalDuration: 300 })
  const [activityExpanded, setActivityExpanded] = useState(true)

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center animate-bounce-gentle">
            <Sparkles className="w-8 h-8 text-accent animate-sparkle" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="page-error">
        <div className="relative w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <HelpCircle className="w-12 h-12 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">¡Ups! Algo salió mal</h2>
        <p className="text-muted-foreground max-w-xs">{error?.message}</p>
        <Button onClick={() => refetch()} className="bg-primary">
          Intentar de nuevo
        </Button>
      </div>
    )
  }

  const parent = dashboard?.parent
  const children = dashboard?.childrenOverview ?? []
  const activity = dashboard?.recentActivity ?? []

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-4xl bg-linear-to-br from-primary via-primary/70 to-accent p-4 sm:p-6 text-white animate-fade-in-up" style={stagger.getStyle(0)}>
        <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />

        <div className="absolute -right-4 sm:-right-8 -top-4 sm:-top-8 h-16 sm:h-32 w-16 sm:w-32 rounded-full bg-white/10 blur-xl animate-pulse-ring hidden sm:block" />
        <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 h-12 sm:h-24 w-12 sm:w-24 rounded-full bg-accent/20 blur-xl animate-float-gentle animation-delay-1000" />

        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            ¡Hola, <span className="text-amauta-orange-light">{parent?.name ?? ' Padres'}</span>!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/80">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Children Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-fade-in-up" style={stagger.getStyle(1)}>
        {children.map((child, index) => (
          <div
            key={child.studentId}
            className="group relative glass-card rounded-2xl p-4 hover-lift hover-glow cursor-pointer animate-scale-in"
            style={{ animationDelay: `${100 + index * 100}ms` }}
          >
            {/* Floating orbs decorativos */}
            <div className={cn(
              "absolute -top-4 -right-4 h-20 w-20 rounded-full blur-2xl opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-150 pointer-events-none",
              index % 2 === 0 ? "bg-accent/10" : "bg-primary/10"
            )} />
            <div className={cn(
              "absolute -bottom-4 -left-4 h-16 w-16 rounded-full blur-2xl opacity-0 transition-all duration-700 delay-100 group-hover:opacity-100 group-hover:scale-150 pointer-events-none",
              index % 2 === 0 ? "bg-primary/10" : "bg-accent/10"
            )} />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden shrink-0 animate-bounce-gentle">
                  <img 
                    src={child.avatar ?? "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop"} 
                    alt={child.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{child.name}</h3>
                  <p className="text-xs text-muted-foreground">Nivel {child.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-accent">{child.points}</p>
                  <p className="text-xs text-muted-foreground">puntos</p>
                </div>
              </div>
              
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3 animate-gentle-pulse" />
                  <span>{child.precision}% precisión</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-accent animate-gentle-pulse animation-delay-500" />
                  <span>{child.streakDays} días racha</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-2xl p-4 animate-fade-in-up" style={stagger.getStyle(2)}>
        <div
          onClick={() => setActivityExpanded(!activityExpanded)}
          className="flex items-center justify-between mb-4 cursor-pointer select-none"
        >
          <h2 className="text-lg font-bold text-foreground">Actividad Reciente</h2>
          <div className="flex items-center gap-2">
            {!activityExpanded && activity.length > 0 && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {activity.length} items
              </span>
            )}
            <ChevronRight
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-300",
                activityExpanded && "rotate-90"
              )}
            />
          </div>
        </div>
        
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-out",
            activityExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-3">
            {activity.length > 0 ? (
              activity.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted hover:bg-muted hover:scale-105 transition-all duration-200"
                >
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 animate-gentle-pulse">
                    {item.action.includes('Completó') ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : item.action.includes('Nivel') ? (
                      <Trophy className="h-4 w-4 text-accent" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-foreground">
                      <span className="font-bold">{item.childName}</span> - {item.action}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{item.subject}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.timestamp}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No hay actividad reciente</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary/70 p-4 sm:p-5 animate-fade-in-up" style={stagger.getStyle(3)}>
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 blur-xl animate-pulse-ring" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-accent/20 blur-xl animate-float-gentle animation-delay-1000" />

        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white">Resumen de Hijos</h2>
          <p className="mt-1 text-sm text-white/80">Monitorea el progreso de tu familia</p>
          
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <p className="text-2xl font-bold text-white animate-bounce-gentle">{children.length}</p>
              <p className="text-xs text-white/70">Hijos</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <p className="text-2xl font-bold text-white animate-bounce-gentle animation-delay-500">
                {children.reduce((sum, c) => sum + c.points, 0)}
              </p>
              <p className="text-xs text-white/70">Puntos</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <p className="text-2xl font-bold text-white animate-bounce-gentle animation-delay-1000">
                {Math.round(children.reduce((sum, c) => sum + c.precision, 0) / (children.length || 1))}%
              </p>
              <p className="text-xs text-white/70">Promedio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}