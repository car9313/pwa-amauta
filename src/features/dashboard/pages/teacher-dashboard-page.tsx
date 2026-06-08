import { CheckCircle2, ChevronRight, TrendingUp, Sparkles, HelpCircle, Trophy, BarChart3, AlertTriangle, GraduationCap, Users, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTeacherDashboard } from "@/features/auth/hooks/useAuth"

export function TeacherDashboardPage() {
  const { data: dashboard, isLoading, isError, error, refetch } = useTeacherDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
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
        <Button onClick={() => refetch()} className="bg-indigo-600 hover:bg-indigo-700">
          Intentar de nuevo
        </Button>
      </div>
    )
  }

  const classes = dashboard?.classes ?? []
  const subjectProgress = dashboard?.subjectProgress ?? []
  const activity = dashboard?.recentActivity ?? []

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-indigo-500 to-purple-600 p-4 sm:p-6 text-white">
        <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                ¡Hola, <span className="text-indigo-200">{dashboard?.name ?? "Docente"}</span>!
              </h1>
              <p className="text-xs sm:text-sm text-white/80">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 mx-auto" />
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{dashboard?.totalStudents ?? 0}</p>
          <p className="text-xs text-slate-500">Estudiantes</p>
        </div>
        <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mx-auto" />
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{dashboard?.totalClasses ?? 0}</p>
          <p className="text-xs text-slate-500">Clases</p>
        </div>
        <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 mx-auto" />
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{dashboard?.averageMastery ?? 0}%</p>
          <p className="text-xs text-slate-500">Dominio</p>
        </div>
      </div>

      {/* Classes */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 px-1">Mis Clases</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {classes.map((cls) => (
            <div key={cls.classId} className="glass-card rounded-2xl p-4 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">{cls.className}</h3>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  {cls.studentCount} alumnos
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${cls.averageMastery}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700">{cls.averageMastery}%</span>
              </div>

              <div className="space-y-2">
                {cls.students.slice(0, 3).map((student) => (
                  <div key={student.studentId} className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-slate-100 overflow-hidden shrink-0">
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                          {student.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="flex-1 text-slate-700 truncate">{student.name}</span>
                    {student.riskFlags.length > 0 && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span className="text-xs font-medium text-slate-500">{student.mastery}%</span>
                  </div>
                ))}
                {cls.students.length > 3 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    +{cls.students.length - 3} estudiantes más
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Progress & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Subject Progress */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Progreso por Materia</h2>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>

          <div className="space-y-3">
            {subjectProgress.map((subject) => (
              <div key={subject.topicId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">{subject.title}</span>
                  <span className="text-slate-500">{subject.mastery}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${subject.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-4">
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
                  {item.action.includes("Completó") ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : item.action.includes("logro") ? (
                    <Trophy className="h-4 w-4 text-amber-500" />
                  ) : item.action.includes("atención") ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    <span className="font-bold">{item.childName}</span> &mdash; {item.action}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{item.subject}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Students at Risk */}
      {classes.some((c) => c.students.some((s) => s.riskFlags.length > 0)) && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-white" />
            <h2 className="text-lg font-bold text-white">Estudiantes que Requieren Atención</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {classes.flatMap((cls) =>
              cls.students
                .filter((s) => s.riskFlags.length > 0)
                .map((student) => (
                  <div key={student.studentId} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-white">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white/20 overflow-hidden shrink-0 flex items-center justify-center font-bold text-lg">
                        {student.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{student.name}</p>
                        <p className="text-xs text-white/70">{student.mastery}% dominio</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {student.riskFlags.map((flag, i) => (
                        <span key={i} className="text-xs bg-white/20 rounded-full px-2 py-0.5">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
