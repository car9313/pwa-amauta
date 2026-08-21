import { useTranslation } from "react-i18next"
import { Award, Flame, Sparkles } from "lucide-react"
import { AmautaBadge, AmautaProgress } from "@/components/amauta"
import { cn } from "@/lib/utils"
import type { ConfidenceStage } from "@/lib/api/storage/db"

interface LessonHeaderProps {
  title: string
  difficultyStars: number
  stepCurrent: number
  stepTotal: number
  xpEarnedThisSession: number
  streakDays?: number | null
  masteryLevel?: number | null
  confidenceStage?: ConfidenceStage | null
}

function LessonHeader({
  title,
  difficultyStars,
  stepCurrent,
  stepTotal,
  xpEarnedThisSession,
  streakDays,
  masteryLevel,
  confidenceStage,
}: LessonHeaderProps) {
  const { t } = useTranslation("lessons")
  const stepProgress = stepTotal > 0 ? (stepCurrent / stepTotal) * 100 : 0

  return (
    <div className="space-y-3">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{title}</h1>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5" aria-label={t("lesson.difficulty")}>
          <span className="text-xs text-muted-foreground">{t("lesson.difficulty")}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Sparkles
                key={star}
                className={cn(
                  "h-4 w-4 transition-colors",
                  star <= difficultyStars
                    ? "text-warning fill-warning"
                    : "text-muted-foreground/20 fill-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </div>

        <span className="hidden sm:block h-4 w-px bg-border" />

        <span className="text-xs sm:text-sm text-muted-foreground font-medium">
          {t("lesson.step", { current: stepCurrent, total: stepTotal })}
        </span>
      </div>

      <AmautaProgress value={stepProgress} size="md" amautaVariant="lesson" animated={false} hideLabel />

      {(xpEarnedThisSession > 0 || streakDays || masteryLevel != null) && (
        <div className="flex flex-wrap items-center gap-2">
          {xpEarnedThisSession > 0 && (
            <AmautaBadge variant="xp" size="sm">
              <Sparkles className="w-3.5 h-3.5 fill-current" />+{xpEarnedThisSession} XP
            </AmautaBadge>
          )}
          {!!streakDays && streakDays > 0 && (
            <AmautaBadge variant="streak" size="sm">
              <Flame className="w-3.5 h-3.5" />
              {t("lesson.streakDays", { days: streakDays })}
            </AmautaBadge>
          )}
          {masteryLevel != null && (
            <AmautaBadge variant={confidenceStage === "mastered" ? "achievement" : "default"} size="sm">
              <Award className="w-3.5 h-3.5" />
              {t("lesson.masteryLevel", { level: masteryLevel })}
            </AmautaBadge>
          )}
        </div>
      )}
    </div>
  )
}

export { LessonHeader }
export type { LessonHeaderProps }
