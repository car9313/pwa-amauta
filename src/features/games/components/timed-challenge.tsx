import { useState } from "react"
import { cn } from "@/lib/utils"
import { GameHeader } from "./game-header"
import { GameResultScreen } from "./game-result"
import type { GameResult } from "../domain/game.types"

interface TimedChallengeViewProps {
  score: number
  correctCount: number
  totalAnswered: number
  streak: number
  remainingSeconds: number
  isFinished: boolean
  prompt: string | null
  isLoading: boolean
  onSubmit: (answer: string) => Promise<void>
  onBack: () => void
  onReset: () => void
  result: GameResult | null
}

export function TimedChallengeView({
  score,
  correctCount,
  totalAnswered,
  streak,
  remainingSeconds,
  isFinished,
  prompt,
  isLoading,
  onSubmit,
  onBack,
  onReset,
  result,
}: TimedChallengeViewProps) {
  const [answer, setAnswer] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!answer.trim() || submitted) return
    setSubmitted(true)
    await onSubmit(answer)
    setAnswer("")
    setSubmitted(false)
  }

  if (isFinished && result) {
    return (
      <GameResultScreen
        result={result}
        onPlayAgain={onReset}
        onHome={onBack}
      />
    )
  }

  return (
    <div className="space-y-4">
      <GameHeader
        title="Reto Contrarreloj"
        onBack={onBack}
        score={score}
        time={remainingSeconds}
        streak={streak}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Correctas: <span className="font-bold text-emerald-600">{correctCount}</span>
          </span>
          <span className="text-slate-500">
            Total: <span className="font-bold text-slate-700">{totalAnswered}</span>
          </span>
          <span className="text-slate-500">
            Rachas: <span className={cn("font-bold", streak >= 3 ? "text-[#f4701f]" : "text-slate-600")}>
              {streak}
            </span>
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              remainingSeconds > 30 ? "bg-emerald-500" : remainingSeconds > 10 ? "bg-[#f4701f]" : "bg-red-500",
            )}
            style={{ width: `${(remainingSeconds / 60) * 100}%` }}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#f4701f]/30 border-t-[#f4701f] rounded-full animate-spin" />
          </div>
        ) : prompt ? (
          <>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 text-center py-4">
              {prompt}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="?"
                disabled={submitted}
                className={cn(
                  "flex-1 h-12 px-4 text-lg font-bold text-slate-800",
                  "bg-white border-2 border-slate-200 rounded-xl",
                  "focus:border-[#f4701f] focus:ring-4 focus:ring-[#f4701f]/20 focus:outline-none",
                  "transition-all duration-300",
                )}
              />
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || submitted}
                className={cn(
                  "h-12 px-6 rounded-xl font-bold text-white text-base",
                  "bg-[#1f4fa3] hover:bg-[#17306d] transition-colors",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                )}
              >
                OK
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-slate-500 py-8">Esperando ejercicio...</p>
        )}
      </div>
    </div>
  )
}
