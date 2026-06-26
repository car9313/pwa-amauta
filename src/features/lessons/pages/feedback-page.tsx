import { useNavigate, useLocation } from "react-router-dom"
import { CheckCircle, Star, RefreshCw, Home, Sparkles, AlertTriangle, ChevronRight } from "lucide-react"
import { AmautaButton } from "@/components/amauta"
import { cn } from "@/lib/utils"
import type { ExerciseResult, Mistake } from "@/features/exercises/domain/exercise.types"

const SCORE_COLORS = {
  excellent: {
    text: "text-success",
    stroke: "stroke-success",
    bg: "bg-success/10",
    border: "border-success/20",
    ring: "ring-success/20",
  },
  good: {
    text: "text-accent",
    stroke: "stroke-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
    ring: "ring-accent/20",
  },
  failed: {
    text: "text-destructive",
    stroke: "stroke-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    ring: "ring-destructive/20",
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

  if (!state?.result && !state?.queued) {
    navigate("/lessons", { replace: true })
    return null
  }

  if (state?.queued) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh] animate-fade-in-up"
      >
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-accent" />
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
          <AmautaButton
            onClick={() => navigate("/lessons")}
            size="child-lg"
            className="w-full"
          >
            Continuar
          </AmautaButton>
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
      className="pb-6 animate-fade-in-up"
    >
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className={cn("p-6 sm:p-8 text-center space-y-4", colors.bg)}>
          {isExcellent && (
            <div className="flex justify-center gap-1 animate-bounce">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  className="h-8 w-8 text-accent fill-accent animation-delay-500"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}

          <ScoreCircle score={result.score} />

          <div className="space-y-1">
            {isExcellent && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-success">
                  ¡Excelente trabajo!
                </h1>
                <p className="text-success">{result.feedbackSummary}</p>
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
                <h1 className="text-2xl sm:text-3xl font-bold text-destructive">
                  ¡Sigue intentando!
                </h1>
                <p className="text-destructive">{result.feedbackSummary}</p>
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
                  className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/10"
                >
                  <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      {MISTAKE_LABELS[mistake.type] ?? mistake.type}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-destructive/70">Gravedad:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((dot) => (
                          <div
                            key={dot}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              dot <= Math.round(mistake.severity * 3)
                                ? "bg-destructive"
                                : "bg-destructive/30"
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
          <AmautaButton
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
          </AmautaButton>

          <AmautaButton
            onClick={() => navigate("/dashboard/student")}
            variant="outline"
            size="child-lg"
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </AmautaButton>
        </div>
      </div>
    </div>
  )
}
