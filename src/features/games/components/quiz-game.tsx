import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/ui/progress-bar"
import { GameHeader } from "./game-header"
import { GameResultScreen } from "./game-result"
import type { QuizQuestion, GameResult } from "../domain/game.types"

interface QuizGameViewProps {
  currentQuestion: QuizQuestion | null
  currentIndex: number
  totalCount: number
  score: number
  correctCount: number
  selectedOption: number | null
  showFeedback: boolean
  isCorrect: boolean | null
  isFinished: boolean
  result: GameResult | null
  onSelectOption: (index: number) => void
  onNext: () => void
  onBack: () => void
  onReset: () => void
}

export function QuizGameView({
  currentQuestion,
  currentIndex,
  totalCount,
  score,
  correctCount,
  selectedOption,
  showFeedback,
  isCorrect,
  isFinished,
  result,
  onSelectOption,
  onNext,
  onBack,
  onReset,
}: QuizGameViewProps) {
  if (isFinished && result) {
    return (
      <GameResultScreen
        result={result}
        onPlayAgain={onReset}
        onHome={onBack}
      />
    )
  }

  if (!currentQuestion) return null

  const progress = ((currentIndex + 1) / totalCount) * 100

  return (
    <div className="space-y-4">
      <GameHeader
        title="Quiz de Opción Múltiple"
        onBack={onBack}
        score={score}
      />

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <ProgressBar value={progress} size="sm" color="primary" />

        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Pregunta {currentIndex + 1} de {totalCount}
            </span>
            <span>
              Correctas: <span className="font-bold text-emerald-600">{correctCount}</span>
            </span>
          </div>

          <p className="text-lg sm:text-xl font-bold text-foreground text-center py-2">
            {currentQuestion.prompt}
          </p>

          <div className="space-y-2" role="radiogroup" aria-label="Opciones de respuesta">
            {currentQuestion.options.map((option, i) => {
              let optionStyle = "border-border bg-card hover:border-border/80"
              if (showFeedback) {
                if (i === currentQuestion.correctIndex) {
                  optionStyle = "border-emerald-500 bg-emerald-50"
                } else if (i === selectedOption) {
                  optionStyle = "border-red-400 bg-red-50"
                } else {
                  optionStyle = "border-border/50 bg-muted/50 text-muted-foreground"
                }
              } else if (i === selectedOption) {
                optionStyle = "border-primary bg-secondary"
              }

              return (
                <button
                  key={i}
                  onClick={() => onSelectOption(i)}
                  disabled={showFeedback}
                  role="radio"
                  aria-checked={i === selectedOption}
                  className={cn(
                    "w-full min-h-[44px] rounded-xl text-base font-semibold border-2 transition-all duration-200",
                    "flex items-center justify-center px-4",
                    optionStyle,
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>

          {showFeedback && (
            <div
              className={cn(
                "text-center p-3 rounded-xl font-semibold text-sm",
                isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-destructive",
              )}
              aria-live="polite"
            >
              {isCorrect ? "¡Correcto!" : `Respuesta: ${currentQuestion.options[currentQuestion.correctIndex]}`}
            </div>
          )}

          {showFeedback && (
            <Button
              onClick={onNext}
              size="child-lg"
              className="w-full"
            >
              {currentIndex + 1 >= totalCount ? "Ver resultado" : "Siguiente"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
