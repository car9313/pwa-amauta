import { Gamepad2, Timer, HelpCircle, Grid3x3 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GameConfig, GameId } from "../domain/game.types"

const ICON_MAP: Record<string, React.ElementType> = {
  grid: Grid3x3,
  timer: Timer,
  "help-circle": HelpCircle,
}

interface GameCardProps {
  config: GameConfig
  onClick: (id: GameId) => void
}

export function GameCard({ config, onClick }: GameCardProps) {
  const Icon = ICON_MAP[config.icon] ?? Gamepad2

  return (
    <button
      onClick={() => onClick(config.id)}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-transparent p-5 sm:p-6 text-left",
        "bg-card shadow-sm hover:shadow-md transition-all duration-200",
        "hover:scale-105 group cursor-pointer min-h-[44px]",
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", config.bgClass)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {config.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
          <span className="inline-block mt-2 text-xs font-medium text-muted-foreground">
            ~{config.estimatedMinutes} min
          </span>
        </div>
      </div>
    </button>
  )
}
