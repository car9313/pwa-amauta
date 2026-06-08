import { cn } from "@/lib/utils"
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="h-full bg-[#1f4fa3] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Pregunta {currentIndex + 1} de {totalCount}
            </span>
            <span>
              Correctas: <span className="font-bold text-emerald-600">{correctCount}</span>
            </span>
          </div>

          <p className="text-lg sm:text-xl font-bold text-slate-800 text-center py-2">
            {currentQuestion.prompt}
          </p>

          <div className="space-y-2">
            {currentQuestion.options.map((option, i) => {
              let optionStyle = "border-slate-200 bg-white hover:border-slate-300"
              if (showFeedback) {
                if (i === currentQuestion.correctIndex) {
                  optionStyle = "border-emerald-500 bg-emerald-50"
                } else if (i === selectedOption) {
                  optionStyle = "border-red-400 bg-red-50"
                } else {
                  optionStyle = "border-slate-100 bg-slate-50 text-slate-400"
                }
              } else if (i === selectedOption) {
                optionStyle = "border-[#1f4fa3] bg-[#e7eefb]"
              }

              return (
                <button
                  key={i}
                  onClick={() => onSelectOption(i)}
                  disabled={showFeedback}
                  className={cn(
                    "w-full h-12 rounded-xl text-base font-semibold border-2 transition-all duration-200",
                    "flex items-center justify-center",
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
                isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
              )}
            >
              {isCorrect ? "¡Correcto!" : `Respuesta: ${currentQuestion.options[currentQuestion.correctIndex]}`}
            </div>
          )}

          {showFeedback && (
            <button
              onClick={onNext}
              className="w-full h-12 rounded-xl font-bold text-white bg-[#1f4fa3] hover:bg-[#17306d] transition-colors"
            >
              {currentIndex + 1 >= totalCount ? "Ver resultado" : "Siguiente"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
