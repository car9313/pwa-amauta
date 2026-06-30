import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { AmautaProgress } from "@/components/amauta"
import type { MemoryCard } from "../domain/game.types"

interface MemoryBoardProps {
  cards: MemoryCard[]
  onFlip: (index: number) => void
  difficulty: "easy" | "medium" | "hard"
}

interface MemoryStatsProps {
  matchedPairs: number
  totalPairs: number
  attempts: number
  elapsedSeconds: number
}

export function MemoryStats({ matchedPairs, totalPairs, attempts, elapsedSeconds }: MemoryStatsProps) {
  const { t } = useTranslation("games")

  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-secondary rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-primary">{matchedPairs}/{totalPairs}</p>
        <p className="text-xs text-muted-foreground">{t("memory.pairs")}</p>
      </div>
      <div className="bg-secondary rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-accent">{attempts}</p>
        <p className="text-xs text-muted-foreground">{t("memory.attempts")}</p>
      </div>
      <div className="bg-secondary rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-muted-foreground">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
        <p className="text-xs text-muted-foreground">{t("memory.time")}</p>
      </div>
    </div>
  )
}

const GRID_COLS: Record<string, string> = {
  easy: "grid-cols-3",
  medium: "grid-cols-4",
  hard: "grid-cols-4",
}

export function MemoryBoard({ cards, onFlip, difficulty }: MemoryBoardProps) {
  const { t } = useTranslation("games")
  const progress = cards.length > 0 ? (cards.filter((c) => c.isMatched).length / cards.length) * 100 : 0

  return (
    <div className="space-y-4">
      <AmautaProgress
        value={progress}
        hideLabel
        amautaVariant="xp"
      />
      <div className={cn("grid gap-2 sm:gap-3", GRID_COLS[difficulty])}>
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={() => onFlip(i)}
            disabled={card.isMatched || card.isFlipped}
            className={cn(
              "relative aspect-square rounded-xl text-xl sm:text-2xl font-bold min-h-[44px]",
              "transition-all duration-300 transform-gpu border-2",
              card.isFlipped || card.isMatched
                ? "bg-primary/10 border-primary [transform:rotateY(180deg)]"
                : "bg-secondary border-border hover:border-primary/50 hover:shadow-md",
              card.isMatched && "bg-success/10 border-success",
            )}
            aria-label={card.isFlipped || card.isMatched ? card.displayValue : t("memory.hiddenCard")}
          >
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "transition-opacity duration-300",
                card.isFlipped || card.isMatched ? "opacity-100" : "opacity-0",
              )}
            >
              {card.isFlipped || card.isMatched ? card.displayValue : "?"}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
