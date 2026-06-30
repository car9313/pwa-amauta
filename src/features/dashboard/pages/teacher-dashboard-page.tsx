import { CheckCircle2, ChevronRight, TrendingUp, Trophy, BarChart3, AlertTriangle, GraduationCap, Users, BookOpen } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AmautaLoadingState, AmautaErrorState, AmautaProgress } from "@/components/amauta"
import { useTeacherDashboard } from "@/features/auth/hooks/useAuth"
import { DASHBOARD_ACTIONS, matchAction } from "../domain/dashboard.constants"

export function TeacherDashboardPage() {
  const { t } = useTranslation("dashboard")
  const { data: dashboard, isLoading, isError, error, refetch } = useTeacherDashboard();

  if (isLoading) {
    return <AmautaLoadingState variant="page" />
  }

  if (isError) {
    return (
      <AmautaErrorState
        message={error?.message}
        onRetry={refetch}
      />
    )
  }

  const classes = dashboard?.classes ?? []
  const subjectProgress = dashboard?.subjectProgress ?? []
  const activity = dashboard?.recentActivity ?? []

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary/80 to-chart-3 p-4 sm:p-6 text-white">
        <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                {t("teacher.welcome", { name: dashboard?.name ?? "Docente" })}
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
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto" />
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{dashboard?.totalStudents ?? 0}</p>
          <p className="text-xs text-muted-foreground">{t("teacher.students")}</p>
        </div>
        <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-chart-3 mx-auto" />
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{dashboard?.totalClasses ?? 0}</p>
          <p className="text-xs text-muted-foreground">{t("teacher.classes")}</p>
        </div>
        <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-success mx-auto" />
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{dashboard?.averageMastery ?? 0}%</p>
          <p className="text-xs text-muted-foreground">{t("teacher.mastery")}</p>
        </div>
      </div>

      {/* Classes */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 px-1">{t("teacher.myClasses")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {classes.map((cls) => (
            <div key={cls.classId} className="glass-card rounded-2xl p-4 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">{cls.className}</h3>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {t("teacher.studentsCount", { count: cls.studentCount })}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-primary to-chart-3"
                    style={{ width: `${cls.averageMastery}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-secondary-foreground">{cls.averageMastery}%</span>
              </div>

              <div className="space-y-2">
                {cls.students.slice(0, 3).map((student) => (
                  <div key={student.studentId} className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-muted overflow-hidden shrink-0">
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {student.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="flex-1 text-secondary-foreground truncate">{student.name}</span>
                    {student.riskFlags.length > 0 && (
                      <AlertTriangle className="h-3.5 w-3.5 text-accent" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">{student.mastery}%</span>
                  </div>
                ))}
                {cls.students.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    {t("teacher.moreStudents", { count: cls.students.length - 3 })}
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
            <h2 className="text-lg font-bold text-foreground">{t("teacher.subjectProgress")}</h2>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {subjectProgress.map((subject) => (
              <div key={subject.topicId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-foreground font-medium">{subject.title}</span>
                  <span className="text-muted-foreground">{subject.mastery}%</span>
                </div>
                <AmautaProgress value={subject.mastery} size="sm" amautaVariant="lesson" hideLabel />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">{t("teacher.recentActivity")}</h2>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted hover:bg-muted transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0">
                  {(() => {
                    const actionType = matchAction(item.action)
                    if (actionType === DASHBOARD_ACTIONS.COMPLETED) {
                      return <CheckCircle2 className="h-4 w-4 text-success" />
                    }
                    if (actionType === DASHBOARD_ACTIONS.ACHIEVEMENT) {
                      return <Trophy className="h-4 w-4 text-accent" />
                    }
                    if (actionType === DASHBOARD_ACTIONS.ATTENTION) {
                      return <AlertTriangle className="h-4 w-4 text-destructive" />
                    }
                    return <TrendingUp className="h-4 w-4 text-blue-500" />
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-foreground">
                    <span className="font-bold">{item.childName}</span> &mdash; {item.action}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.subject}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Students at Risk */}
      {classes.some((c) => c.students.some((s) => s.riskFlags.length > 0)) && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-warning to-accent p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-white" />
            <h2 className="text-lg font-bold text-white">{t("teacher.atRiskStudents")}</h2>
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
                        <p className="text-xs text-white/70">{t("teacher.studentMastery", { mastery: student.mastery })}</p>
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
