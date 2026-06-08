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
        "bg-white shadow-sm hover:shadow-md transition-all duration-200",
        "hover:scale-[1.02] group cursor-pointer",
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", config.bgClass)}>
          <Icon className="h-6 w-6" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#1f4fa3] transition-colors">
            {config.title}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{config.description}</p>
          <span className="inline-block mt-2 text-xs font-medium text-slate-400">
            ~{config.estimatedMinutes} min
          </span>
        </div>
      </div>
    </button>
  )
}
