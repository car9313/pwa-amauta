import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, TrendingUp, BookOpen, ChevronRight, Calendar, Flame, Trophy, Star, Target } from "lucide-react"
import { AmautaButton, AmautaCard, AmautaProgress, AmautaStatCard, AmautaLoadingState, AmautaErrorState, Character } from "@/components/amauta"
import { AgendaItem } from "../components/agenda-item"
import { useStudentDashboard } from "@/hooks/useStudent"
import { useStagger } from "@/hooks/useStagger"
import { cn } from "@/lib/utils"

interface LocalAgendaItem {
  lessonId: string
  title: string
  subject: string
  scheduledAt: string
  durationMinutes: number
  completed: boolean
}

interface StudentDashboardProps {
  studentId?: string
}

const DEFAULT_STUDENT_ID = "stu_445"

export function StudentDashboardPage({
  studentId = DEFAULT_STUDENT_ID,
}: StudentDashboardProps) {
  const { t } = useTranslation("dashboard")
  const { data: dashboard, isLoading, isError, error, refetch } = useStudentDashboard(studentId)
  const stagger = useStagger({ count: 7, baseDelay: 50, totalDuration: 300 })
  const navigate = useNavigate()
  const [agendaExpanded, setAgendaExpanded] = useState(true)
  const [isAddingAgenda, setIsAddingAgenda] = useState(false)
  const [agendaInput, setAgendaInput] = useState("")
  const [localAgenda, setLocalAgenda] = useState<LocalAgendaItem[]>([])

  const handleAddAgenda = () => {
    if (!agendaInput.trim()) return
    const newItem: LocalAgendaItem = {
      lessonId: `local_${Date.now()}`,
      title: agendaInput.trim(),
      subject: t("student.customTask"),
      scheduledAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 15,
      completed: false,
    }
    setLocalAgenda((prev) => [...prev, newItem])
    setAgendaInput("")
    setIsAddingAgenda(false)
  }

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

  const student = dashboard?.student
  const agenda = dashboard?.agenda ?? []
  const progress = dashboard?.progress ?? []
  const achievements = dashboard?.recentAchievements ?? []

  const weekDays = student?.streakWeek?.map((active) => ({ active })) ?? [
    { active: true }, { active: true }, { active: true }, { active: true }, { active: false }, { active: false }, { active: false }
  ]

  const allAgenda = [...agenda, ...localAgenda]

  const weekDayLabels = t("student.weekDays", { returnObjects: true }) as string[]

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Welcome Hero Card - Fully responsive */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-4xl bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 text-white">
        <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />
        
        <div className="absolute -right-4 sm:-right-8 -top-4 sm:-top-8 h-16 sm:h-32 w-16 sm:w-32 rounded-full bg-white/10 blur-xl animate-pulse-ring hidden sm:block" />
        <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 h-12 sm:h-24 w-12 sm:w-24 rounded-full bg-accent/20 blur-xl animate-float-gentle animation-delay-1000" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="animate-fade-in-up">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                {t("student.welcome", { name: student?.name ?? "Estudiante" })}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-white/80 font-medium">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            
            <div className="relative animate-scale-in animate-bounce-gentle" style={stagger.getStyle(0)}>
              <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
              <div className="relative">
                <Character size="lg" />
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/15 p-3 sm:p-4 backdrop-blur-sm animate-fade-in-up" style={stagger.getStyle(1)}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/50 animate-pulse" />
                <div className="relative flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full bg-white/20">
                  <Flame className="h-5 sm:h-6 w-5 sm:w-6 text-accent animate-gentle-pulse" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white/70">{t("student.streakLabel")}</p>
                <p className="text-2xl sm:text-4xl font-bold tabular-nums">{student?.streakDays ?? 0}</p>
                <p className="text-xs sm:text-sm text-white/70">{t("student.streakDays")}</p>
              </div>
            </div>
            
            <div className="ml-auto flex gap-1 sm:gap-1.5">
              {weekDayLabels.slice(0, 7).map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-110",
                    weekDays[index]?.active
                      ? "bg-accent text-white shadow-lg shadow-accent/30"
                      : "bg-white/15 text-white/50"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-fade-in-up" style={stagger.getStyle(2)}>
        <AmautaStatCard icon={Trophy} value={student?.points ?? 0} label={t("student.points")} color="yellow" />
        <AmautaStatCard icon={Star} value={t("student.level", { level: student?.level ?? 1 })} label={t("student.progress")} color="primary" />
        <AmautaStatCard icon={Target} value={`${student?.precision ?? 0}%`} label={t("student.precision")} color="success" />
      </div>

      {/* Today's Agenda */}
      <div className="scrollbar-hide animate-fade-in-up" style={stagger.getStyle(3)}>
        <AmautaCard amautaVariant="glass" className="p-3 sm:p-4 gap-0">
          <div
            onClick={() => setAgendaExpanded(!agendaExpanded)}
            className="mb-3 sm:mb-4 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg bg-secondary animate-bounce-gentle">
                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">{t("student.todayAgenda")}</h2>
            </div>
            <div className="flex items-center gap-2">
              <AmautaButton
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsAddingAgenda(!isAddingAgenda)
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-secondary text-primary hover:bg-primary hover:text-white hover:scale-110 active:scale-90 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
              </AmautaButton>
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${agendaExpanded ? 'rotate-90' : ''}`}
              />
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${
              agendaExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-2 sm:space-y-3">
              {isAddingAgenda && (
                <div className="flex gap-2 animate-fade-in-up">
                  <input
                    type="text"
                    placeholder={t("student.addPlaceholder")}
                    value={agendaInput}
                    onChange={(e) => setAgendaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddAgenda()
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-background border-2 border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-accent h-[44px]"
                  />
                  <AmautaButton
                    amautaVariant="accent"
                    size="child-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddAgenda()
                    }}
                  >
                    {t("student.addButton")}
                  </AmautaButton>
                </div>
              )}
              {allAgenda.map((item) => (
                <AgendaItem
                  key={item.lessonId}
                  title={item.title}
                  subject={item.subject}
                  time={item.scheduledAt}
                  duration={`${item.durationMinutes} ${t("student.minutes")}`}
                  status={item.completed ? "completed" : "pending"}
                  onStart={() => navigate('/lessons')}
                />
              ))}
              {!isAddingAgenda && allAgenda.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("student.noTasks")}</p>
              )}
            </div>
          </div>
        </AmautaCard>
      </div>

      {/* Progress Section */}
      <div className="animate-fade-in-up" style={stagger.getStyle(4)}>
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg bg-orange-100">
                <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">{t("student.yourProgress")}</h2>
            </div>
            <button onClick={() => navigate('/progress')} className="text-xs sm:text-sm font-semibold text-primary hover:underline hover:scale-105 transition-transform duration-200">{t("student.viewAll")}</button>
          </div>

          <div className="space-y-4">
            {progress.map((item) => (
              <div key={item.topicId} className="space-y-1.5 hover:scale-105 transition-transform duration-200 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <span className="text-sm font-bold tabular-nums text-primary">{Math.round(item.mastery)}%</span>
                </div>
                <AmautaProgress
                  value={Math.round(item.mastery)}
                  amautaVariant="topic"
                  size="sm"
                  showValue={false}
                  colorByValue
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-400 to-yellow-400 p-4 sm:p-5 animate-fade-in-up" style={stagger.getStyle(5)}>
        <div className="absolute -right-2 sm:-right-4 -top-2 sm:-top-4 h-12 sm:h-20 w-12 sm:w-20 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-1 sm:-bottom-2 -left-1 sm:-left-2 h-10 sm:h-16 w-10 sm:w-16 rounded-full bg-white/10 blur-lg" />

        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{t("student.followLearning")}</h2>
          <p className="mt-1 text-xs sm:text-sm text-white/80">{t("student.followDescription")}</p>
          
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
              <AmautaButton variant="ghost" size="child-sm" onClick={() => navigate('/lessons')} className="bg-white/20 text-white hover:bg-white/30 gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden xs:inline">{t("student.continueLesson")}</span>
                <span className="xs:hidden">{t("student.continue")}</span>
              </AmautaButton>
              <AmautaButton variant="ghost" size="child-sm" onClick={() => navigate('/practice')} className="bg-white/20 text-white hover:bg-white/30">{t("student.play")}</AmautaButton>
            </div>
            
            <div className="hidden sm:flex items-center justify-center animate-bounce-gentle">
              <Character size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="animate-fade-in-up" style={stagger.getStyle(6)}>
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground">{t("student.latestAchievements")}</h2>
            <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground hover:scale-110 transition-transform duration-200" />
          </div>

          {achievements.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {achievements.map((achievement) => {
                const emojiMap: Record<string, string> = {
                  streak: "\u{1F525}",
                  level: "\u{2B50}",
                  accuracy: "\u{1F3AF}",
                }
                const emoji = emojiMap[achievement.type] ?? "\u{1F3C6}"

                return (
                  <div
                    key={achievement.id}
                    className="flex-shrink-0 w-24 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 text-center border border-yellow-200"
                  >
                    <div className="text-3xl mb-1">{emoji}</div>
                    <p className="text-xs font-semibold text-foreground">
                      {achievement.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("student.noAchievements")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}