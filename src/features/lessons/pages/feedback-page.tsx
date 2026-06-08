import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { CheckCircle, Star, RefreshCw, Home, Sparkles, AlertTriangle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ExerciseResult, Mistake } from "@/features/exercises/domain/exercise.types"

const SCORE_COLORS = {
  excellent: {
    text: "text-emerald-600",
    stroke: "stroke-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    ring: "ring-emerald-200",
  },
  good: {
    text: "text-accent",
    stroke: "stroke-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
    ring: "ring-accent/20",
  },
  failed: {
    text: "text-red-500",
    stroke: "stroke-red-400",
    bg: "bg-red-50",
    border: "border-red-200",
    ring: "ring-red-200",
  },
}

const MISTAKE_LABELS: Record<Mistake["type"], string> = {
  CARRY_MISSED: "Olvidaste llevar el número",
  COLUMN_MISALIGN: "Desalineaste las columnas",
  SIGN_ERROR: "Confundiste suma con resta",
  CALCULATION_ERROR: "Error en el cálculo",
}

function ScoreCircle({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const colors = score >= 80 ? SCORE_COLORS.excellent : score >= 70 ? SCORE_COLORS.good : SCORE_COLORS.failed

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colors.stroke} transition-all duration-1000 ease-out`}
        />
      </svg>
      <span className={cn("absolute text-3xl font-bold", colors.text)}>
        {score}
      </span>
    </div>
  )
}

export function FeedbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { result?: ExerciseResult; queued?: boolean } | null
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  if (!state?.result && !state?.queued) {
    navigate("/lessons", { replace: true })
    return null
  }

  if (state?.queued) {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-[60vh] transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-amber-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              ¡Respuesta guardada!
            </h1>
            <p className="text-muted-foreground">
              Se enviará automáticamente cuando tengas conexión a internet.
            </p>
          </div>
          <Button
            onClick={() => navigate("/lessons")}
            size="child-lg"
            className="w-full"
          >
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  const result = state.result!
  const isExcellent = result.passed && result.score >= 80
  const isGood = result.passed && result.score < 80
  const isFailed = !result.passed

  const colors = isExcellent ? SCORE_COLORS.excellent : isGood ? SCORE_COLORS.good : SCORE_COLORS.failed

  return (
    <div
      className={cn(
        "pb-6 transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className={cn("p-6 sm:p-8 text-center space-y-4", colors.bg)}>
          {isExcellent && (
            <div className="flex justify-center gap-1 animate-bounce">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  className="h-8 w-8 text-amber-400 fill-amber-400 animation-delay-500"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}

          <ScoreCircle score={result.score} />

          <div className="space-y-1">
            {isExcellent && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">
                  ¡Excelente trabajo!
                </h1>
                <p className="text-emerald-600">{result.feedbackSummary}</p>
              </>
            )}
            {isGood && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-accent">
                  ¡Buen trabajo!
                </h1>
                <p className="text-accent">{result.feedbackSummary}</p>
              </>
            )}
            {isFailed && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-red-600">
                  ¡Sigue intentando!
                </h1>
                <p className="text-red-500">{result.feedbackSummary}</p>
              </>
            )}
          </div>
        </div>

        {result.mistakes.length > 0 && (
          <div className="px-6 sm:px-8 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Revisa tus errores
            </h2>
            <div className="space-y-2">
              {result.mistakes.map((mistake, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700">
                      {MISTAKE_LABELS[mistake.type] ?? mistake.type}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-red-400">Gravedad:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((dot) => (
                          <div
                            key={dot}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              dot <= Math.round(mistake.severity * 3)
                                ? "bg-red-400"
                                : "bg-red-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.nextAction && (
          <div className="px-6 sm:px-8 py-4 border-b border-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">
                  {result.nextAction.action === "ADVANCE" && "Siguiente tema: listo para avanzar"}
                  {result.nextAction.action === "REINFORCE" && "Sigue practicando para reforzar"}
                  {result.nextAction.action === "REMEDIATE" && "Repasemos lo básico primero"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-3">
          <Button
            onClick={() => navigate("/lessons")}
            size="child-lg"
            className={cn(
              "w-full shadow-sm transition-all duration-200",
              isFailed
                ? "bg-accent hover:bg-accent/80 hover:shadow-md"
                : "bg-primary hover:bg-primary/80 hover:shadow-md"
            )}
          >
            {isFailed ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Intentar de nuevo
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="ml-1 h-5 w-5" />
              </>
            )}
          </Button>

          <Button
            onClick={() => navigate("/dashboard/student")}
            variant="outline"
            size="child-lg"
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
