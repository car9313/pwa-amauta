import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { AlertCircle, ArrowRight, CheckCircle2, HelpCircle, Loader2, Volume2 } from "lucide-react"
import { AmautaButton } from "@/components/amauta"
import { cn } from "@/lib/utils"
import type { AnswerType } from "@/features/exercises/domain/exercise.types"
import type { LessonExerciseStatus } from "@/features/lessons/domain/lesson-session.types"

interface QuestionCardProps {
  prompt: string
  answerType: AnswerType
  options?: string[]
  hints: string[]
  subInstruction?: string
  selectedAnswer: string | null
  inputValue: string
  status: LessonExerciseStatus
  showHint: boolean
  onListen: () => void
  onSelectOption: (option: string) => void
  onInputChange: (value: string) => void
  onSubmitInput: () => void
  onToggleHint: () => void
  onContinue: () => void
}

function QuestionCard({
  prompt,
  answerType,
  options,
  hints,
  subInstruction,
  selectedAnswer,
  inputValue,
  status,
  showHint,
  onListen,
  onSelectOption,
  onInputChange,
  onSubmitInput,
  onToggleHint,
  onContinue,
}: QuestionCardProps) {
  const { t } = useTranslation("lessons")
  const isAnswered = status === "correct" || status === "incorrect"
  const isChecking = status === "checking"
  const isDisabled = isChecking || isAnswered
  const hasOptions = !!options && options.length > 0

  const resolveOptionStyles = (option: string): string => {
    if (!isDisabled && !isChecking) {
      return "bg-white border-2 border-border text-foreground hover:bg-muted/50 hover:border-primary/40 shadow-xs"
    }
    if (selectedAnswer !== option) {
      return "bg-muted/30 border-2 border-border text-muted-foreground opacity-60"
    }
    if (status === "correct") {
      return "bg-success border-2 border-success text-white shadow-lg ring-4 ring-success/20 scale-[1.02]"
    }
    if (status === "incorrect") {
      return "bg-warning/15 border-2 border-warning text-warning shadow-md ring-4 ring-warning/10"
    }
    return "bg-primary/10 border-2 border-primary/50 text-foreground ring-4 ring-primary/10 animate-pulse"
  }

  const renderHint = () => {
    const firstHint = hints[0]
    if (!firstHint || isDisabled) return null

    return (
      <div>
        <button
          type="button"
          onClick={onToggleHint}
          className="text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 flex items-center gap-1.5 px-2 py-1 rounded-xl transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>{showHint ? t("lesson.hintHide") : t("lesson.hintShow")}</span>
        </button>

        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent text-xs sm:text-sm font-medium"
          >
            {firstHint}
          </motion.div>
        )}
      </div>
    )
  }

  const renderOptions = () => {
    if (!hasOptions) return null

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
        {options.map((option, idx) => (
          <motion.button
            key={option}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelectOption(option)}
            whileHover={!isDisabled ? { scale: 1.02 } : undefined}
            whileTap={!isDisabled ? { scale: 0.96 } : undefined}
            transition={{ duration: 0.15 }}
            className={cn(
              "min-h-[58px] sm:min-h-[62px] p-4 rounded-2xl font-bold text-lg sm:text-xl",
              "flex items-center justify-between text-left transition-colors select-none",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
              resolveOptionStyles(option)
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  isDisabled && selectedAnswer === option
                    ? "bg-white/90 text-foreground"
                    : "bg-secondary border border-border text-muted-foreground"
                )}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{option}</span>
            </span>

            {status === "correct" && selectedAnswer === option && (
              <CheckCircle2 className="w-6 h-6 stroke-[3] animate-bounce" />
            )}
            {status === "incorrect" && selectedAnswer === option && (
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            )}
          </motion.button>
        ))}
      </div>
    )
  }

  const renderInputFallback = () => {
    if (hasOptions) return null

    return (
      <input
        type={answerType === "NUMERIC" ? "number" : "text"}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmitInput()}
        placeholder={t("lesson.inputPlaceholder")}
        disabled={isDisabled}
        aria-label={t("lesson.inputPlaceholder")}
        className={cn(
          "w-full h-12 px-4 text-lg sm:text-xl font-bold text-foreground",
          "bg-card border-2 border-border rounded-xl",
          "focus:border-accent focus:ring-4 focus:ring-accent/20 focus:outline-none",
          "transition-all duration-300 placeholder:text-muted-foreground",
          "disabled:bg-muted disabled:text-muted-foreground"
        )}
      />
    )
  }

  return (
    <div className="w-full flex flex-col gap-5 sm:gap-6">
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex items-center justify-between gap-4">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
            {prompt}
          </h2>

          <button
            type="button"
            onClick={onListen}
            aria-label={t("lesson.listening")}
            title={t("lesson.listening")}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 border-2 border-primary/20 hover:bg-primary/15 hover:border-primary/40 text-primary flex items-center justify-center transition-transform active:scale-90 shadow-xs flex-shrink-0 cursor-pointer"
          >
            <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
          </button>
        </div>

        {subInstruction && (
          <p className="text-xs sm:text-sm text-muted-foreground px-1">{subInstruction}</p>
        )}

        {renderHint()}
      </div>

      {renderOptions()}

      {renderInputFallback()}

      {!isAnswered && !hasOptions && (
        <AmautaButton
          onClick={onSubmitInput}
          disabled={!inputValue.trim() || isChecking}
          size="child-lg"
          className="w-full shadow-sm hover:shadow-md"
        >
          {isChecking ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("lesson.checking")}
            </span>
          ) : (
            t("lesson.submit")
          )}
        </AmautaButton>
      )}

      {isAnswered && (
        <div className="flex items-center justify-end pt-1">
          <AmautaButton
            amautaVariant={status === "correct" ? "success" : "accent"}
            size="child-md"
            onClick={onContinue}
            className="px-6 font-semibold shadow-md flex items-center gap-2 flex-shrink-0"
          >
            <span>{t("lesson.continue")}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </AmautaButton>
        </div>
      )}
    </div>
  )
}

export { QuestionCard }
export type { QuestionCardProps }
