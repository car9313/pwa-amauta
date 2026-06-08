import { Trophy, Star, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { GameResult } from "../domain/game.types"

interface GameResultProps {
  result: GameResult
  onPlayAgain: () => void
  onHome: () => void
}

export function GameResultScreen({ result, onPlayAgain, onHome }: GameResultProps) {
  const isExcellent = result.score >= 80
  const isGood = result.score >= 50
  const percentage = result.totalCount > 0 ? Math.round((result.correctCount / result.totalCount) * 100) : 0

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 max-w-sm w-full text-center space-y-6">
        <div
          className={cn(
            "w-20 h-20 rounded-full mx-auto flex items-center justify-center",
            isExcellent ? "bg-emerald-50" : isGood ? "bg-orange-50" : "bg-red-50",
          )}
        >
          <Trophy
            className={cn(
              "h-10 w-10",
              isExcellent ? "text-emerald-500" : isGood ? "text-[#f4701f]" : "text-slate-400",
            )}
          />
        </div>

        <div className="space-y-1">
          <h2
            className={cn(
              "text-2xl font-bold",
              isExcellent ? "text-emerald-600" : isGood ? "text-[#f4701f]" : "text-slate-600",
            )}
          >
            {isExcellent ? "¡Excelente!" : isGood ? "¡Buen trabajo!" : "¡Sigue intentando!"}
          </h2>
          <p className="text-slate-500 text-sm">
            {result.correctCount} de {result.totalCount} correctas
          </p>
        </div>

        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "h-6 w-6",
                i <= Math.round(percentage / 20) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200",
              )}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-[#1f4fa3]">{result.score}</p>
            <p className="text-xs text-slate-500">Puntaje</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-[#f4701f]">+{result.earnedPoints}</p>
            <p className="text-xs text-slate-500">Puntos</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onPlayAgain}
            className="w-full h-12 bg-[#1f4fa3] hover:bg-[#17306d] text-base font-bold"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Jugar de nuevo
          </Button>
          <Button
            onClick={onHome}
            variant="outline"
            className="w-full h-12 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-base font-medium"
          >
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
