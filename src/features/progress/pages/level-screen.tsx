import { ChevronRight, Lightbulb, Trophy, Target, AlertTriangle } from "lucide-react"
import { AmautaCard, AmautaContainer } from "@/components/amauta"

import { AmautaLoadingState, AmautaErrorState, AmautaProgress } from "@/components/amauta"
import { useStudentProgress } from "@/features/auth/hooks/useAuth"

const DEFAULT_STUDENT_ID = "stu_001"

interface LevelScreenProps {
  studentId?: string
}

export function LevelScreen({ studentId = DEFAULT_STUDENT_ID }: LevelScreenProps) {
  const { data: progress, isLoading, isError, error, refetch } = useStudentProgress(studentId)

  if (isLoading) {
    return (
      <AmautaContainer className="flex items-center justify-center min-h-[60vh]">
        <AmautaLoadingState variant="page" />
      </AmautaContainer>
    )
  }

  if (isError) {
    return (
      <AmautaContainer className="flex flex-col items-center justify-center min-h-[60vh]">
        <AmautaErrorState
          message={error?.message}
          onRetry={() => refetch()}
        />
      </AmautaContainer>
    )
  }

  const subjects = progress?.subjects ?? []
  const achievements = progress?.achievements ?? []
  const weakAreas = progress?.weakAreas ?? []

  return (
    <AmautaContainer className="space-y-4 sm:space-y-6 pb-6">
      <section aria-label="Progreso general">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/70 to-accent p-4 sm:p-6 text-white animate-fade-in-up">
          <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl font-bold">
              Mi Progreso
            </h1>

            <div className="mt-4 flex items-center gap-4">
              <div className="relative">
                <svg className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90" aria-hidden="true">
                  <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/20" />
                  <circle
                    cx="40" cy="40" r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(progress?.overallProgress ?? 0) * 2.2} 220`}
                    className="text-accent transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold">{progress?.overallProgress ?? 0}%</span>
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm">Progreso general</p>
                <p className="text-xl font-bold">{progress?.studentName ?? "Estudiante"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Progreso por materia">
        <AmautaCard className="gap-0 rounded-2xl p-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground">Por Materia</h2>
          </div>

          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.subjectId} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground truncate">{subject.subjectName}</h3>
                    <span className="text-sm font-bold text-muted-foreground shrink-0 ml-2">{Math.round(subject.mastery * 100)}%</span>
                  </div>
                  <div className="mt-2">
                    <AmautaProgress
                      value={Math.round(subject.mastery * 100)}
                      size="sm"
                      amautaVariant={subject.mastery >= 0.8 ? "level" : subject.mastery >= 0.5 ? "lesson" : "xp"}
                      animated
                      hideLabel
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{subject.lastPractice}</span>
              </div>
            ))}
          </div>
        </AmautaCard>
      </section>

      <section aria-label="Logros">
        <AmautaCard className="gap-0 rounded-2xl p-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground">Logros</h2>
          </div>

          {achievements.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/10">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Trophy className="h-5 w-5 text-accent" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">{achievement.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aún no tienes logros. ¡Sigue practicando!</p>
          )}
        </AmautaCard>
      </section>

      {weakAreas.length > 0 && (
        <section aria-label="Áreas a mejorar">
          <AmautaCard className="gap-0 rounded-2xl p-4 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-accent" aria-hidden="true" />
              <h2 className="text-lg font-bold text-foreground">Áreas a Mejorar</h2>
            </div>

            <div className="space-y-3">
              {weakAreas.map((area) => (
                <div key={area.topicId} className="flex items-start gap-3 p-3 rounded-xl bg-accent/10">
                  <Lightbulb className="h-5 w-5 text-accent mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground">{area.topicName}</h3>
                    <p className="text-xs text-muted-foreground">{area.recommendation}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" aria-hidden="true" />
                </div>
              ))}
            </div>
          </AmautaCard>
        </section>
      )}
    </AmautaContainer>
  )
}