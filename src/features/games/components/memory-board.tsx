import { cn } from "@/lib/utils"
import type { MemoryCard, MemoryDifficulty } from "../domain/game.types"

interface MemoryBoardProps {
  cards: MemoryCard[]
  onFlip: (index: number) => void
  difficulty: MemoryDifficulty
}

const COLS_MAP: Record<MemoryDifficulty, string> = {
  easy: "grid-cols-4",
  medium: "grid-cols-4",
  hard: "grid-cols-4",
}

export function MemoryBoard({ cards, onFlip, difficulty }: MemoryBoardProps) {
  return (
    <div className={cn("grid gap-2 sm:gap-3 max-w-md mx-auto", COLS_MAP[difficulty])}>
      {cards.map((card, index) => (
        <button
          key={card.id}
          onClick={() => onFlip(index)}
          disabled={card.isMatched}
          aria-label={card.isFlipped ? card.content : "Carta oculta"}
          className={cn(
            "aspect-square rounded-xl text-base sm:text-lg font-bold transition-all duration-300",
            "border-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
            "min-h-[44px]",
            card.isMatched
              ? "opacity-0 pointer-events-none scale-90"
              : card.isFlipped
                ? "bg-card border-primary text-primary shadow-sm scale-100"
                : "bg-primary border-primary text-white hover:bg-primary/80 hover:scale-105 active:scale-95",
          )}
        >
          {card.isFlipped ? card.content : "?"}
        </button>
      ))}
    </div>
  )
}

export function MemoryStats({
  matchedPairs,
  totalPairs,
  attempts,
  elapsedSeconds,
}: {
  matchedPairs: number
  totalPairs: number
  attempts: number
  elapsedSeconds: number
}) {
  return (
    <div className="flex items-center justify-center gap-6 text-sm">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Pares</p>
        <p className="font-bold text-foreground">
          {matchedPairs}/{totalPairs}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Intentos</p>
        <p className="font-bold text-foreground">{attempts}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Tiempo</p>
        <p className="font-mono font-bold text-foreground">{elapsedSeconds}s</p>
      </div>
    </div>
  )
}
