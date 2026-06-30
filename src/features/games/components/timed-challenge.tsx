import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  prompt: string
  isLoading: boolean
  onSubmit: (answer: string) => void
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
  const { t } = useTranslation("games")
  const [input, setInput] = useState("")

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return
    onSubmit(input.trim())
    setInput("")
  }, [input, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  if (isFinished && result) {
    return (
      <GameResultScreen
        result={result}
        onPlayAgain={onReset}
        onHome={onBack}
      />
    )
  }

  const progress = remainingSeconds > 0 ? (remainingSeconds / 60) * 100 : 0

  return (
    <div className="space-y-4">
      <GameHeader
        title={t("timed.title")}
        onBack={onBack}
        score={score}
        time={remainingSeconds}
        streak={streak}
      />

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <AmautaProgress
          value={progress}
          size="sm"
          amautaVariant="lesson"
          hideLabel
        />
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t("timed.stats", { correct: correctCount, total: totalAnswered })}
            </span>
            {streak >= 3 && (
              <span className="text-accent font-bold">
                {t("timed.streak")}{" "}{streak}
              </span>
            )}
          </div>

          <div
            className={cn(
              "text-2xl sm:text-3xl font-bold text-center py-4",
              "bg-secondary/50 rounded-xl",
            )}
          >
            {prompt}
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("timed.inputPlaceholder")}
              disabled={isLoading}
              className="text-lg text-center h-12"
              autoFocus
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              size="child-lg"
            >
              {isLoading ? t("timed.verifying") : t("timed.submit")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
