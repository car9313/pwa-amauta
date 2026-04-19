import { useEffect, useState } from "react"
import { CheckCircle2, ChevronRight, TrendingUp, Sparkles, HelpCircle, Trophy, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useParentDashboard } from "@/features/auth/hooks/useAuth"
import { cn } from "@/lib/utils"



export function ParentDashboardPage() {
  const [isVisible, setIsVisible] = useState(false);
  const { data: dashboard, isLoading, isError, error, refetch } = useParentDashboard();

  useEffect(() => {
    setIsVisible(true)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#f4701f]/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-[#f4701f]/30 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#f4701f] animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
        <div className="relative w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
          <HelpCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">¡Ups! Algo salió mal</h2>
        <p className="text-slate-500 max-w-xs">{error?.message}</p>
        <Button onClick={() => refetch()} className="bg-[#1f4fa3]">
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
      <div className={cn(
        "relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1f4fa3] via-[#3d5a80] to-[#f4701f] p-4 sm:p-6 text-white transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            ¡Hola, <span className="text-[#fccca1]">{parent?.name ?? ' Padres'}</span>!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/80">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Children Overview */}
      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 transition-all duration-700 delay-200",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {children.map((child) => (
          <div
            key={child.studentId}
            className="glass-card rounded-2xl p-4 hover-lift cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden shrink-0">
                <img 
                  src={child.avatar ?? "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop"} 
                  alt={child.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate">{child.name}</h3>
                <p className="text-xs text-slate-500">Nivel {child.level}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#f4701f]">{child.points}</p>
                <p className="text-xs text-slate-500">puntos</p>
              </div>
            </div>
            
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span>{child.precision}% precisión</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-[#f4701f]" />
                <span>{child.streakDays} días racha</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className={cn(
        "glass-card rounded-2xl p-4 transition-all duration-700 delay-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Actividad Reciente</h2>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>
        
        <div className="space-y-3">
          {activity.map((item) => (
            <div 
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0">
                {item.action.includes('Completó') ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : item.action.includes('Nivel') ? (
                  <Trophy className="h-4 w-4 text-amber-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  <span className="font-bold">{item.childName}</span> - {item.action}
                </p>
                <p className="text-xs text-slate-500 truncate">{item.subject}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{item.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1f4fa3] to-[#3d5a80] p-4 sm:p-5 transition-all duration-700 delay-400",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <h2 className="text-lg font-bold text-white">Resumen de Hijos</h2>
        <p className="mt-1 text-sm text-white/80">Monitorea el progreso de tu familia</p>
        
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{children.length}</p>
            <p className="text-xs text-white/70">Hijos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {children.reduce((sum, c) => sum + c.points, 0)}
            </p>
            <p className="text-xs text-white/70">Puntos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {Math.round(children.reduce((sum, c) => sum + c.precision, 0) / (children.length || 1))}%
            </p>
            <p className="text-xs text-white/70">Promedio</p>
          </div>
        </div>
      </div>
    </div>
  )
}