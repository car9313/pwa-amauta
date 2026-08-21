import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import confetti from "canvas-confetti"
import { BookOpen, Calendar, CheckCircle2, ChevronRight, Circle, Flame, Plus, Star, Target, Trash2, TrendingUp, Trophy } from "lucide-react"
import { AmautaButton, AmautaCard, AmautaErrorState, AmautaLoadingState, AmautaProgress, AmautaStatCard, Character } from "@/components/amauta"
import { AgendaItem } from "../components/agenda-item"
import { StreakModal } from "../components/streak-modal"
import { useAgendaTasks } from "../hooks/useAgendaTasks"
import { useStagger } from "@/hooks/useStagger"
import { playCorrectSound } from "@/lib/sound"
import { cn } from "@/lib/utils"
import type { AgendaTask } from "@/features/exercises/domain/exercise.types"

interface StudentDashboardProps {
  studentId?: string
}

const DEFAULT_STUDENT_ID = "stu_445"

const SUBJECT_OPTIONS = ["math", "reading", "science", "art"] as const

type AgendaFilter = "all" | "pending" | "completed"

const CONFETTI_COLORS = ["#1f4fa3", "#f2994a", "#FFD700"]

export function StudentDashboardPage({
  studentId = DEFAULT_STUDENT_ID,
}: StudentDashboardProps) {
  const { t, i18n } = useTranslation("dashboard")
  const {
    student,
    serverAgenda,
    localTasks,
    progress,
    recentAchievements: achievements,
    isLoading,
    isError,
    error,
    refetch,
    addTask,
    toggleTask,
    removeTask,
  } = useAgendaTasks(studentId)
  const stagger = useStagger({ count: 7, baseDelay: 50, totalDuration: 300 })
  const navigate = useNavigate()

  const [agendaExpanded, setAgendaExpanded] = useState(true)
  const [isAddingAgenda, setIsAddingAgenda] = useState(false)
  const [agendaInput, setAgendaInput] = useState("")
  const [agendaSubject, setAgendaSubject] = useState<string>("math")
  const [agendaFilter, setAgendaFilter] = useState<AgendaFilter>("all")
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false)

  const subjectLabels: Record<string, string> = {
    math: t("student.subjects.math"),
    reading: t("student.subjects.reading"),
    science: t("student.subjects.science"),
    art: t("student.subjects.art"),
  }
  const getSubjectLabel = (subject: string) => subjectLabels[subject] ?? subject

  const handleAddAgenda = () => {
    const title = agendaInput.trim()
    if (!title) return
    void addTask({ title, subject: agendaSubject })
    setAgendaInput("")
    setIsAddingAgenda(false)
  }

  const handleToggleTask = (task: AgendaTask) => {
    void toggleTask(task)
    if (!task.completed) {
      playCorrectSound()
      void confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
        colors: CONFETTI_COLORS,
      })
    }
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

  const weekDays = student?.streakWeek?.map((active) => ({ active })) ?? [
    { active: true }, { active: true }, { active: true }, { active: true }, { active: false }, { active: false }, { active: false }
  ]

  const weekDayLabels = t("student.weekDays", { returnObjects: true }) as string[]

  const totalCount = serverAgenda.length + localTasks.length
  const completedCount =
    serverAgenda.filter((item) => item.completed).length +
    localTasks.filter((task) => task.completed).length
  const pendingCount = totalCount - completedCount

  const filteredServerAgenda = serverAgenda.filter((item) =>
    agendaFilter === "all" || (agendaFilter === "completed") === item.completed
  )
  const filteredLocalTasks = localTasks.filter((task) =>
    agendaFilter === "all" || (agendaFilter === "completed") === task.completed
  )

  const emptyMessage =
    agendaFilter === "pending"
      ? t("student.noPendingTasks")
      : agendaFilter === "completed"
        ? t("student.noCompletedTasks")
        : t("student.noTasks")

  const filterOptions: { value: AgendaFilter; label: string; count: number }[] = [
    { value: "all", label: t("student.filterAll"), count: totalCount },
    { value: "pending", label: t("student.filterPending"), count: pendingCount },
    { value: "completed", label: t("student.filterCompleted"), count: completedCount },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streakDays={student?.streakDays ?? 0}
        weekDayLabels={weekDayLabels}
        activeWeek={weekDays}
      />

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
                {new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            <div className="relative animate-scale-in animate-bounce-gentle" style={stagger.getStyle(0)}>
              <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
              <div className="relative">
                <Character size="lg" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setIsStreakModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setIsStreakModalOpen(true)
              }
            }}
            className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/15 p-3 sm:p-4 backdrop-blur-sm animate-fade-in-up cursor-pointer transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={stagger.getStyle(1)}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/50 animate-pulse" />
                <div className="relative flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full bg-white/20">
                  <Flame className="h-5 sm:h-6 w-5 sm:w-6 text-accent animate-gentle-pulse" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white/70">
                  {t("student.streakLabel")}{" "}
                  <span className="font-bold text-accent underline">{t("student.streakModal.viewDetails")}</span>
                </p>
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
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg bg-secondary animate-bounce-gentle">
                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">{t("student.todayAgenda")}</h2>
                {totalCount > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t("student.tasksCompleted", { completed: completedCount, total: totalCount })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-secondary p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAgendaFilter(option.value)}
                    className={cn(
                      "px-2 py-1 rounded-lg transition-all whitespace-nowrap",
                      agendaFilter === option.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
              <AmautaButton
                variant="ghost"
                size="icon"
                onClick={() => setIsAddingAgenda(!isAddingAgenda)}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-secondary text-primary hover:bg-primary hover:text-white hover:scale-110 active:scale-90 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
              </AmautaButton>
              <button
                onClick={() => setAgendaExpanded(!agendaExpanded)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/70 transition-colors"
              >
                <ChevronRight className={cn("h-4 w-4 transition-transform duration-300", agendaExpanded && "rotate-90")} />
              </button>
            </div>
          </div>

          {totalCount > 0 && (
            <AmautaProgress
              value={completedCount}
              max={totalCount}
              amautaVariant="level"
              size="md"
              hideLabel
              className="mb-3"
            />
          )}

          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-out",
              agendaExpanded ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="space-y-2 sm:space-y-3">
              {isAddingAgenda && (
                <div className="flex flex-col sm:flex-row gap-2 rounded-xl border border-border bg-secondary/50 p-3 animate-fade-in-up">
                  <input
                    type="text"
                    placeholder={t("student.addTaskPlaceholder")}
                    value={agendaInput}
                    onChange={(e) => setAgendaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddAgenda()
                      }
                    }}
                    autoFocus
                    className="flex-1 px-4 py-2 bg-background border-2 border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-accent h-[44px]"
                  />
                  <select
                    value={agendaSubject}
                    onChange={(e) => setAgendaSubject(e.target.value)}
                    className="px-3 py-2 bg-background border-2 border-border rounded-xl text-sm font-bold text-foreground h-[44px] cursor-pointer focus:outline-none focus:border-accent"
                  >
                    {SUBJECT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getSubjectLabel(option)}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 justify-end sm:items-center">
                    <AmautaButton
                      variant="ghost"
                      size="child-sm"
                      onClick={() => setIsAddingAgenda(false)}
                    >
                      {t("student.cancel")}
                    </AmautaButton>
                    <AmautaButton
                      amautaVariant="accent"
                      size="child-sm"
                      onClick={handleAddAgenda}
                    >
                      {t("student.saveTask")}
                    </AmautaButton>
                  </div>
                </div>
              )}

              {filteredServerAgenda.map((item) => (
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

              {filteredLocalTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border p-3 transition-all",
                    task.completed
                      ? "border-success/30 bg-success/10 opacity-80"
                      : "border-border bg-background hover:bg-secondary/50"
                  )}
                >
                  <div
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                    onClick={() => handleToggleTask(task)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleTask(task)
                      }}
                      className={cn(
                        "rounded-full p-1 transition-transform active:scale-90",
                        task.completed ? "text-success" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-bold transition-all",
                          task.completed ? "text-muted-foreground line-through" : "text-foreground"
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <span className="rounded-md border bg-background px-2 py-0.5 text-[11px] font-bold text-foreground">
                          {getSubjectLabel(task.subject)}
                        </span>
                        <span className="font-bold text-warning">+{task.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => void removeTask(task.id)}
                    aria-label={t("student.deleteTask")}
                    title={t("student.deleteTask")}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {!isAddingAgenda && filteredServerAgenda.length === 0 && filteredLocalTasks.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
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
              <div key={item.topicId} className="space-y-1.5 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <span className="text-sm font-bold tabular-nums text-primary">{Math.round(item.mastery)}%</span>
                </div>
                <AmautaProgress
                  value={Math.round(item.mastery)}
                  amautaVariant="topic"
                  size="md"
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
