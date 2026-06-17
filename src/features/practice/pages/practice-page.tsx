import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart3, Sparkles, AlertTriangle, Star, ChevronRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNextExercise, useSubmitAnswer } from "@/features/exercises/hooks/useExercise"
import { exerciseKeys } from "@/lib/query/keys"
import { useAuthStore } from "@/features/auth/presentation/store/auth-store"
import { getNextExercise } from "@/services/exercise.service"
import { useQueryClient } from "@tanstack/react-query"
import { QUEUED_OFFLINE } from "@/lib/sync/useSafeMutation"
import { difficultyToStars } from "@/features/exercises/domain/exercise.types"

type PracticeTopic = "all" | "sumas" | "restas" | "multiplicacion" | "division"

const TOPICS: { key: PracticeTopic; label: string; emoji: string }[] = [
  { key: "all", label: "Todo", emoji: "mixed" },
  { key: "sumas", label: "Sumas", emoji: "sumas" },
  { key: "restas", label: "Restas", emoji: "restas" },
  { key: "multiplicacion", label: "Multiplicación", emoji: "multiplicacion" },
  { key: "division", label: "División", emoji: "division" },
]

const STRENGTHS = ["LOW", "MEDIUM", "HIGH"] as const

const DEFAULT_STUDENT_ID = "stu_445"

export function PracticePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const studentId = useAuthStore((state) => state.selectedStudentId) ?? DEFAULT_STUDENT_ID
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? null)
  const [topic, setTopic] = useState<PracticeTopic>("all")
  const [difficulty, setDifficulty] = useState<number>(0)
  const [answer, setAnswer] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [showSelector, setShowSelector] = useState(true)

  const { data: exercise, isLoading, isError, error, refetch } = useNextExercise(studentId)
  const { mutate: submitAnswer, isPending } = useSubmitAnswer(studentId)

  const prefetchNext = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: exerciseKeys.next(studentId, tenantId),
      queryFn: () => getNextExercise(studentId),
      staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    })
  }, [queryClient, studentId, tenantId])

  const handleStart = () => {
    setShowSelector(false)
    setScore(0)
    setStreak(0)
    setTotalAttempts(0)
    setAnswer("")
    setSubmitted(false)
  }

  const handleSubmit = () => {
    if (!answer.trim() || submitted || !exercise) return
    setSubmitted(true)
    submitAnswer(
      { exerciseId: exercise.exerciseId, answer },
      {
        onSuccess: (data) => {
          if (data === QUEUED_OFFLINE) {
            navigate("/lessons/feedback", { state: { queued: true }, replace: true })
            return
          }
          setTotalAttempts((p) => p + 1)
          if (data.passed) {
            setStreak((p) => p + 1)
            setScore((p) => p + Math.round(data.score / 10))
          } else {
            setStreak(0)
          }
          prefetchNext()
          navigate("/lessons/feedback", { state: { result: data }, replace: true })
        },
      },
    )
  }

  const isLoadingState = isLoading && !exercise

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <div
        className="animate-fade-in-up"
      >
        {showSelector ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Práctica Libre</h1>
                <p className="text-sm text-muted-foreground">Elige qué practicar</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border p-5 sm:p-6 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Tema
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTopic(t.key)}
                      className={cn(
                        "min-h-[44px] rounded-xl text-sm font-semibold border-2 transition-all duration-200",
                        topic === t.key
                          ? "border-primary bg-secondary text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-border/80",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Dificultad
                </h2>
                <div className="flex gap-2">
                  {STRENGTHS.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => setDifficulty(i)}
                      className={cn(
                        "flex-1 min-h-[44px] rounded-xl text-sm font-semibold border-2 transition-all duration-200",
                        difficulty === i
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-card text-muted-foreground hover:border-border/80",
                      )}
                    >
                      <div className="flex items-center justify-center gap-0.5">
                        {[0, 1, 2].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-3.5 w-3.5",
                              star <= i ? "fill-accent text-accent" : "fill-muted-foreground/20 text-muted-foreground/20",
                            )}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStart}
                size="child-lg"
                className="w-full shadow-sm"
              >
                Comenzar a practicar
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowSelector(true)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Cambiar tema
              </button>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Aciertos: <span className="font-bold text-success">{score}</span>
                </span>
                <span className="text-muted-foreground">
                  Racha:{" "}
                  <span className={cn("font-bold", streak >= 3 ? "text-accent" : "text-foreground")}>
                    {streak}
                    {streak >= 3 && " 🔥"}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Intentos: <span className="font-bold text-foreground">{totalAttempts}</span>
                </span>
              </div>
            </div>

            {isLoadingState ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-accent animate-spin" />
                  </div>
                </div>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 text-center px-4">
                <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground">No pudimos cargar el ejercicio</h2>
                <p className="text-muted-foreground max-w-xs">{(error instanceof Error ? error.message : null) ?? "Intenta de nuevo."}</p>
                <Button onClick={() => refetch()} className="bg-primary">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-2xl shadow-sm border border-border p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ejercicio</h2>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3.5 w-3.5",
                          star <= difficultyToStars(exercise?.difficulty ?? "MEDIUM")
                            ? "text-accent fill-accent"
                            : "text-muted-foreground/20 fill-muted-foreground/20",
                        )}
                      />
                    ))}
                  </div>
                </div>

                {exercise?.prompt && (
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {exercise.prompt}
                  </p>
                )}

                {exercise?.hints?.[0] && (
                  <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-3">
                    {exercise.hints[0]}
                  </p>
                )}

                <input
                  type={exercise?.answerType === "NUMERIC" ? "number" : "text"}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Escribe tu respuesta"
                  disabled={submitted}
                  className={cn(
                    "w-full h-12 px-4 text-lg sm:text-xl font-bold text-foreground",
                    "bg-card border-2 border-border rounded-xl",
                    "focus:border-accent focus:ring-4 focus:ring-accent/20 focus:outline-none",
                    "transition-all duration-300 placeholder:text-muted-foreground",
                    "disabled:bg-muted disabled:text-muted-foreground",
                  )}
                />

                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isPending || submitted}
                  size="child-lg"
                  className="w-full shadow-sm transition-all duration-200"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verificando...
                    </span>
                  ) : (
                    "Contestar"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
