import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AmautaProgress } from "@/components/amauta"
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

  const timerPercent = (remainingSeconds / 60) * 100

  return (
    <div className="space-y-4">
      <GameHeader
        title="Reto Contrarreloj"
        onBack={onBack}
        score={score}
        time={remainingSeconds}
        streak={streak}
      />

      <div className="bg-card rounded-2xl shadow-sm border border-border p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Correctas: <span className="font-bold text-success">{correctCount}</span>
          </span>
          <span className="text-muted-foreground">
            Total: <span className="font-bold text-foreground">{totalAnswered}</span>
          </span>
          <span className="text-muted-foreground">
            Rachas: <span className={cn("font-bold", streak >= 3 ? "text-accent" : "text-foreground")}>
              {streak}
            </span>
          </span>
        </div>

        <AmautaProgress
          value={timerPercent}
          size="md"
          amautaVariant={remainingSeconds > 30 ? "level" : remainingSeconds > 10 ? "xp" : "lesson"}
          hideLabel
        />

        <p className="sr-only" aria-live="polite">
          {remainingSeconds} segundos restantes
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : prompt ? (
          <>
            <p className="text-xl sm:text-2xl font-bold text-foreground text-center py-4">
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
                  "flex-1 h-12 px-4 text-lg font-bold text-foreground",
                  "bg-card border-2 border-border rounded-xl",
                  "focus:border-accent focus:ring-4 focus:ring-accent/20 focus:outline-none",
                  "transition-all duration-300",
                )}
              />
              <Button
                onClick={handleSubmit}
                disabled={!answer.trim() || submitted}
                size="child-md"
              >
                OK
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">Esperando ejercicio...</p>
        )}
      </div>
    </div>
  )
}
