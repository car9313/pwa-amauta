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
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 max-w-sm w-full text-center space-y-6">
        <div
          className={cn(
            "w-20 h-20 rounded-full mx-auto flex items-center justify-center",
            isExcellent ? "bg-success/10" : isGood ? "bg-accent/10" : "bg-destructive/10",
          )}
        >
          <Trophy
            className={cn(
              "h-10 w-10",
              isExcellent ? "text-success" : isGood ? "text-accent" : "text-muted-foreground",
            )}
          />
        </div>

        <div className="space-y-1">
          <h2
            className={cn(
              "text-2xl font-bold",
              isExcellent ? "text-success" : isGood ? "text-accent" : "text-muted-foreground",
            )}
          >
            {isExcellent ? "¡Excelente!" : isGood ? "¡Buen trabajo!" : "¡Sigue intentando!"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {result.correctCount} de {result.totalCount} correctas
          </p>
        </div>

        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "h-6 w-6",
                i <= Math.round(percentage / 20) ? "text-accent fill-accent" : "text-muted-foreground/20 fill-muted-foreground/20",
              )}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-secondary rounded-xl p-3">
            <p className="text-2xl font-bold text-primary">{result.score}</p>
            <p className="text-xs text-muted-foreground">Puntaje</p>
          </div>
          <div className="bg-secondary rounded-xl p-3">
            <p className="text-2xl font-bold text-accent">+{result.earnedPoints}</p>
            <p className="text-xs text-muted-foreground">Puntos</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onPlayAgain}
            size="child-lg"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Jugar de nuevo
          </Button>
          <Button
            onClick={onHome}
            variant="outline"
            size="child-lg"
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
