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
          className={cn(
            "aspect-square rounded-xl text-base sm:text-lg font-bold transition-all duration-300",
            "border-2 focus:outline-none focus:ring-4 focus:ring-[#1f4fa3]/30",
            card.isMatched
              ? "opacity-0 pointer-events-none scale-90"
              : card.isFlipped
                ? "bg-white border-[#1f4fa3] text-[#1f4fa3] shadow-sm scale-100"
                : "bg-[#1f4fa3] border-[#1f4fa3] text-white hover:bg-[#17306d] hover:scale-105 active:scale-95",
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
        <p className="text-xs text-slate-500">Pares</p>
        <p className="font-bold text-slate-700">
          {matchedPairs}/{totalPairs}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs text-slate-500">Intentos</p>
        <p className="font-bold text-slate-700">{attempts}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-slate-500">Tiempo</p>
        <p className="font-mono font-bold text-slate-700">{elapsedSeconds}s</p>
      </div>
    </div>
  )
}
