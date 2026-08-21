import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { AlertCircle, ArrowRight, Award, CheckCircle2 } from "lucide-react"
import { AmautaBadge, AmautaButton, Character } from "@/components/amauta"
import { cn } from "@/lib/utils"
import type { ConfidenceStage } from "@/lib/api/storage/db"
import type {
  LessonExerciseStatus,
  LessonLayoutMode,
} from "@/features/lessons/domain/lesson-session.types"

interface MascotFeedbackProps {
  status: LessonExerciseStatus
  layoutMode: LessonLayoutMode
  explanationMessage?: string | null
  xpEarnedThisSession?: number
  masteryLevel?: number | null
  confidenceStage?: ConfidenceStage | null
  onContinue?: () => void
}

function resolveExpression(
  status: LessonExerciseStatus,
  confidenceStage?: ConfidenceStage | null
) {
  if (status === "checking") return "thinking"
  if (status === "correct") {
    return confidenceStage === "mastered" ? "superstar" : "happy"
  }
  if (status === "incorrect") return "encouraging"
  return "idle"
}

function MascotFeedback({
  status,
  layoutMode,
  explanationMessage,
  xpEarnedThisSession = 0,
  masteryLevel,
  confidenceStage,
  onContinue,
}: MascotFeedbackProps) {
  const { t } = useTranslation("lessons")
  const expression = resolveExpression(status, confidenceStage)
  const isCorrect = status === "correct"
  const isIncorrect = status === "incorrect"

  const renderRewardPills = () => (
    <div className="flex flex-wrap items-center gap-1.5">
      {isCorrect && (
        <AmautaBadge variant="xp" size="sm">
          <Award className="w-3.5 h-3.5" />+{xpEarnedThisSession} XP
        </AmautaBadge>
      )}
      {isCorrect && masteryLevel != null && (
        <AmautaBadge variant="default" size="sm">
          {t("lesson.masteryLevel", { level: masteryLevel })}
        </AmautaBadge>
      )}
    </div>
  )

  if (layoutMode === "sidebar") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 relative">
        <motion.div
          key={status}
          initial={{ scale: 0.85, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="relative z-10"
        >
          <Character size="2xl" expression={expression} className="border-4 border-white shadow-xl" />
        </motion.div>

        <AnimatePresence mode="wait">
          {(isCorrect || isIncorrect) && (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.15 }}
              className={cn(
                "mt-6 w-full max-w-sm rounded-2xl border-2 p-4 shadow-sm text-left flex items-start gap-3",
                isCorrect ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"
              )}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-7 h-7 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-7 h-7 text-warning flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1.5">
                <p
                  className={cn(
                    "text-base font-bold",
                    isCorrect ? "text-success" : "text-warning"
                  )}
                >
                  {isCorrect ? t("lesson.correctTitle") : t("lesson.incorrectTitle")}
                </p>
                {renderRewardPills()}
                {isIncorrect && explanationMessage && (
                  <p className="text-xs font-medium text-muted-foreground leading-snug">
                    {explanationMessage}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {!isCorrect && !isIncorrect && (
            <motion.div
              key="mascot-idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 text-sm font-semibold text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl border border-border"
            >
              {status === "checking" ? t("lesson.checking") : t("lesson.companionMessage")}
            </motion.div>
          )}
        </AnimatePresence>

        {onContinue && (isCorrect || isIncorrect) && (
          <AmautaButton
            amautaVariant={isCorrect ? "success" : "accent"}
            size="child-md"
            onClick={onContinue}
            className="mt-4 px-6 font-semibold shadow-md flex items-center gap-2 flex-shrink-0"
          >
            <span>{t("feedback.continue")}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </AmautaButton>
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {(isCorrect || isIncorrect) && (
        <motion.div
          key="mascot-sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 pt-8 pb-6 px-4 sm:px-6 border-t-4 shadow-2xl rounded-t-[28px] bg-card",
            isCorrect ? "border-success" : "border-warning"
          )}
        >
          <div className="absolute -top-12 left-5">
            <motion.div
              initial={{ scale: 0.7, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.1 }}
            >
              <Character size="lg" expression={expression} className="border-4 border-white bg-white shadow-lg" />
            </motion.div>
          </div>

          <div className="max-w-lg mx-auto space-y-3">
            <div className="pl-24 sm:pl-28 space-y-1.5">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
                )}
                <span
                  className={cn(
                    "text-lg sm:text-xl font-bold tracking-tight",
                    isCorrect ? "text-success" : "text-warning"
                  )}
                >
                  {isCorrect ? t("lesson.correctTitle") : t("lesson.incorrectTitle")}
                </span>
              </div>

              {renderRewardPills()}

              {isIncorrect && explanationMessage && (
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-snug">
                  {explanationMessage}
                </p>
              )}
            </div>

            <AmautaButton
              amautaVariant={isCorrect ? "success" : "accent"}
              size="child-lg"
              onClick={onContinue}
              className="w-full shadow-lg font-semibold flex items-center justify-center gap-2 h-14"
            >
              <span>{t("feedback.continue")}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </AmautaButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { MascotFeedback }
export type { MascotFeedbackProps }
