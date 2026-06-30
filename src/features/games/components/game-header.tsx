import { ArrowLeft, Clock, Star, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

interface GameHeaderProps {
  title: string
  onBack: () => void
  score?: number
  time?: number
  streak?: number
}

export function GameHeader({ title, onBack, score, time, streak }: GameHeaderProps) {
  const { t } = useTranslation("games")

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </button>

      <h2 className="text-base sm:text-lg font-bold text-foreground truncate">{title}</h2>

      <div className="flex items-center gap-3">
        {time !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <Clock className={cn("h-4 w-4", time <= 10 ? "text-destructive" : "text-muted-foreground")} />
            <span className={cn("font-mono font-bold", time <= 10 ? "text-destructive" : "text-foreground")}>
              {time}s
            </span>
          </div>
        )}
        {score !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 text-accent fill-accent" />
            <span className="font-bold text-foreground">{score}</span>
          </div>
        )}
        {streak !== undefined && streak >= 3 && (
          <div className="flex items-center gap-1 text-sm">
            <Zap className="h-4 w-4 text-accent" />
            <span className="font-bold text-accent">{streak}</span>
          </div>
        )}
      </div>
    </div>
  )
}
