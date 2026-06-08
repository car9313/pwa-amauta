import { ArrowLeft, Clock, Star, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameHeaderProps {
  title: string
  onBack: () => void
  score?: number
  time?: number
  streak?: number
}

export function GameHeader({ title, onBack, score, time, streak }: GameHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1f4fa3] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">{title}</h2>

      <div className="flex items-center gap-3">
        {time !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <Clock className={cn("h-4 w-4", time <= 10 ? "text-red-500" : "text-slate-400")} />
            <span className={cn("font-mono font-bold", time <= 10 ? "text-red-500" : "text-slate-600")}>
              {time}s
            </span>
          </div>
        )}
        {score !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="font-bold text-slate-600">{score}</span>
          </div>
        )}
        {streak !== undefined && streak >= 3 && (
          <div className="flex items-center gap-1 text-sm">
            <Zap className="h-4 w-4 text-[#f4701f]" />
            <span className="font-bold text-[#f4701f]">{streak}</span>
          </div>
        )}
      </div>
    </div>
  )
}
