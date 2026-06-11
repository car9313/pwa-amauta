import { Plus, TrendingUp, BookOpen, ChevronRight, Flame, Sparkles, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatCard } from "../components/stat-card"
import { AgendaItem } from "../components/agenda-item"
import { ProgressCard } from "../components/progress-card"
import { AchievementCard } from "../components/achievement-card"
import { useStudentDashboard } from "@/hooks/useStudent"
import { cn } from "@/lib/utils"

interface StudentDashboardProps {
  studentId?: string
}

const DEFAULT_STUDENT_ID = "stu_445"

export function StudentDashboardPage({
  studentId = DEFAULT_STUDENT_ID,
}: StudentDashboardProps) {
  const { data: dashboard, isLoading, isError, error, refetch } = useStudentDashboard(studentId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-accent animate-spin" />
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
        <h2 className="text-xl font-bold text-foreground">¡Ups! Algo salió mal</h2>
        <p className="text-muted-foreground max-w-xs">{error?.message}</p>
        <Button onClick={() => refetch()} className="bg-primary">
          Intentar de nuevo
        </Button>
      </div>
    )
  }

  const student = dashboard?.student
  const agenda = dashboard?.agenda ?? []
  const progress = dashboard?.progress ?? []
  const achievements = dashboard?.recentAchievements ?? []

  const weekDays = student?.streakWeek?.map((active) => ({ active })) ?? [
    { active: true }, { active: true }, { active: true }, { active: true }, { active: false }, { active: false }, { active: false }
  ]

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Welcome Hero Card - Fully responsive */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-4xl bg-linear-to-br from-primary via-primary/80 to-accent p-4 sm:p-6 text-white">
        <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />
        
        <div className="absolute -right-4 sm:-right-8 -top-4 sm:-top-8 h-16 sm:h-32 w-16 sm:w-32 rounded-full bg-white/10 blur-xl animate-pulse-ring hidden sm:block" />
        <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 h-12 sm:h-24 w-12 sm:w-24 rounded-full bg-accent/20 blur-xl animate-float-gentle animation-delay-1000" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="animate-fade-in-up">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                ¡Hola, <span className="text-amauta-orange-light">{student?.name ?? 'Estudiante'}</span>!
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-white/80 font-medium">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            
            <div className="relative animate-scale-in" style={{ animationDelay: "200ms" }}>
              <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
              <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-full border-2 sm:border-4 border-white/40 overflow-hidden bg-white shadow-xl">
                <img
                  src={student?.avatar ?? "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop"}
                  alt={student?.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/15 p-3 sm:p-4 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/50 animate-pulse" />
                <div className="relative flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full bg-white/20">
                  <Flame className="h-5 sm:h-6 w-5 sm:w-6 text-accent" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white/70">Racha actual</p>
                <p className="text-2xl sm:text-4xl font-bold tabular-nums">{student?.streakDays ?? 0}</p>
                <p className="text-xs sm:text-sm text-white/70">días</p>
              </div>
            </div>
            
            <div className="ml-auto flex gap-1 sm:gap-1.5">
              {weekDays.slice(0, 7).map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all duration-300",
                    day.active
                      ? "bg-accent text-white shadow-lg shadow-accent/30"
                      : "bg-white/15 text-white/50"
                  )}
                >
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <StatCard type="points" value={student?.points ?? 0} label="Puntos" delay={0} />
        <StatCard type="level" value={`Nivel ${student?.level ?? 1}`} label="Progreso" delay={1} />
        <StatCard type="accuracy" value={`${student?.precision ?? 0}%`} label="Precisión" delay={2} />
      </div>

      {/* Today's Agenda */}
      <div className="scrollbar-hide animate-fade-in-up" style={{ animationDelay: "500ms" }}>
        <Card variant="glass" className="p-3 sm:p-4 gap-0">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg bg-secondary">
                <svg className="h-4 sm:h-5 w-4 sm:w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Agenda de Hoy</h2>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-secondary text-primary hover:bg-primary hover:text-white">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {agenda.map((item) => (
              <AgendaItem
                key={item.lessonId}
                title={item.title}
                subject={item.subject}
                time={item.scheduledAt}
                duration={`${item.durationMinutes} min`}
                status={item.completed ? "completed" : "pending"}
                onStart={() => {}}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Progress Section */}
      <div className="animate-fade-in-up" style={{ animationDelay: "600ms" }}>
        <Card variant="glass" className="p-3 sm:p-4 gap-0">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg bg-red-50">
                <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Tu Progreso</h2>
            </div>
            <button className="text-xs sm:text-sm font-semibold text-primary hover:underline">Ver todo</button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {progress.map((item) => (
              <ProgressCard
                key={item.topicId}
                title={item.title}
                progress={Math.round(item.mastery * 100)}
                color={item.mastery >= 1 ? "green" : item.mastery >= 0.5 ? "blue" : "orange"}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-linear-to-br from-accent to-accent/80 p-4 sm:p-5 animate-fade-in-up" style={{ animationDelay: "700ms" }}>
        <div className="absolute -right-2 sm:-right-4 -top-2 sm:-top-4 h-12 sm:h-20 w-12 sm:w-20 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-1 sm:-bottom-2 -left-1 sm:-left-2 h-10 sm:h-16 w-10 sm:w-16 rounded-full bg-white/10 blur-lg" />

        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">¡Sigue aprendiendo!</h2>
          <p className="mt-1 text-xs sm:text-sm text-white/80">Completa tus lecciones de hoy con Amauta</p>
          
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
              <Button className="hover-lift flex-1 sm:flex-none rounded-xl bg-white/20 text-white hover:bg-white/30 gap-2 text-sm">
                <BookOpen className="h-4 w-4" />
                <span className="hidden xs:inline">Continuar Lección</span>
                <span className="xs:hidden">Continuar</span>
              </Button>
              <Button className="hover-lift flex-1 sm:flex-none rounded-xl bg-white/20 text-white hover:bg-white/30 text-sm">¡Jugar!</Button>
            </div>
            
            <div className="hidden sm:flex h-12 sm:h-14 w-12 sm:w-14 items-center justify-center rounded-full bg-white shadow-lg overflow-hidden">
              <img src="/img/amauta-mascot.jpg" alt="Amauta" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="animate-fade-in-up" style={{ animationDelay: "800ms" }}>
        <Card variant="glass" className="p-3 sm:p-4 gap-0">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">Últimos Logros</h2>
            <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground" />
          </div>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                type={achievement.type}
                title={achievement.title}
                description={achievement.description}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}