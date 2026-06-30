"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { Star, ChevronRight, HelpCircle } from "lucide-react"
import { AmautaButton, AmautaContainer } from "@/components/amauta"

import { AmautaLoadingState, AmautaErrorState, AmautaProgress } from "@/components/amauta"

import { cn } from "@/lib/utils"
import { useNextExercise, useSubmitAnswer } from "@/features/exercises/hooks/useExercise"
import { getNextExercise } from "@/services/exercise.service"
import { exerciseKeys } from "@/lib/query/keys"
import { useAuthStore } from "@/features/auth/presentation/store/auth-store"
import { difficultyToStars } from "@/features/exercises/domain/exercise.types"
import { QUEUED_OFFLINE } from "@/lib/sync/useSafeMutation"
import { DownloadLesson } from "@/components/DownloadLesson"

interface LessonPageProps {
  studentId?:   string
  sessionId?:   string
  lessonTitle?: string
  topicHint?:   string
  stepTotal?:   number
  initialStep?: number
  onBack?:      () => void
  onSkip?:      () => void
}

const DEFAULT_STUDENT_ID = "stu_445"
const DEFAULT_STEP_TOTAL = 3

export function LessonPage({
  studentId  = DEFAULT_STUDENT_ID,
  lessonTitle,
  stepTotal  = DEFAULT_STEP_TOTAL,
  initialStep = 1,
  onBack,
  onSkip,
}: LessonPageProps) {
  const { t } = useTranslation("lessons")
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? null)
  const [answer, setAnswer]         = useState("")
  const [submitted, setSubmitted]   = useState(false)

  const { data: exercise, isLoading, isError, error } = useNextExercise(studentId)
  const { mutate: submitAnswer, isPending } = useSubmitAnswer(studentId)

  const prefetchNextExercise = () => {
    queryClient.prefetchQuery({
      queryKey: exerciseKeys.next(studentId, tenantId),
      queryFn: () => getNextExercise(studentId),
      staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    });
  };

  const handleSubmit = () => {
    if (!answer.trim() || submitted || !exercise) return
    setSubmitted(true)
    submitAnswer(
      { exerciseId: exercise.exerciseId, answer },
      {
        onSuccess: (data) => {
          if (data === QUEUED_OFFLINE) {
            navigate("/lessons/feedback", { state: { queued: true }, replace: true });
            return;
          }
          prefetchNextExercise();
          navigate("/lessons/feedback", { state: { result: data }, replace: true });
        },
      }
    )
  }

  if (isLoading) {
    return <AmautaLoadingState variant="page" />
  }

  if (isError) {
    return (
      <AmautaErrorState
        title={t("lesson.errorTitle")}
        message={(error instanceof Error ? error.message : null) ?? t("lesson.errorMessage")}
        onRetry={onBack}
        retryLabel={t("lesson.goHome")}
      />
    )
  }

  const title          = lessonTitle ?? exercise?.topicId ?? t("lesson.title")
  const starsCount     = difficultyToStars(exercise?.difficulty ?? "MEDIUM")
  const currentStep    = exercise?.stepCurrent   ?? initialStep
  const totalSteps     = exercise?.stepTotal     ?? stepTotal
  const mainProblem    = exercise?.prompt ?? ""
  const explanation    = exercise?.hints?.[0] ?? ""
  const demoContent    = exercise?.demoContent ?? exercise?.hints?.[1] ?? null
  const secondaryQ     = exercise?.secondaryQuestion ?? null
  const subInstruction = exercise?.subInstruction ?? t("lesson.subInstruction")
  const stepProgress   = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <AmautaContainer as="div" className="space-y-4 sm:space-y-6 pb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          {t("lesson.home")}
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{t("lesson.title")}</span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl bg-card shadow-sm border border-border animate-fade-in-up"
      >
        <div className="p-5 sm:p-6 space-y-5">
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{t("lesson.difficulty")}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                        star <= starsCount
                          ? "text-accent fill-accent"
                          : "text-muted-foreground/20 fill-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="h-4 w-px bg-border hidden sm:block" />

              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                {t("lesson.step", { current: currentStep, total: totalSteps })}
              </span>
            </div>

            <AmautaProgress value={stepProgress} size="sm" amautaVariant="lesson" animated={false} hideLabel />
          </div>

          {mainProblem && (
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
              <p className="text-sm sm:text-base text-foreground font-medium">
                {t("lesson.resolve")}{" "}
                <span className="text-lg sm:text-2xl font-bold text-foreground">
                  {mainProblem}
                </span>
              </p>

              {explanation && (
                <p className="text-sm text-muted-foreground">{explanation}</p>
              )}

              {demoContent ? (
                <div className="bg-amauta-blue-dark rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
                  <p className="text-white text-lg sm:text-2xl font-bold tracking-wide">
                    {demoContent}
                  </p>
                  <div className="hidden sm:block w-16 h-16 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                    <img
                      src="/img/amauta-mascot.jpg"
                      alt="Amauta"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-amauta-blue-dark rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
                  <p className="text-white/50 text-sm italic">
                    {t("lesson.demoPlaceholder")}
                  </p>
                  <div className="hidden sm:block w-16 h-16 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                    <img
                      src="/img/amauta-mascot.jpg"
                      alt="Amauta"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {secondaryQ && (
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-foreground">
                    {secondaryQ}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {subInstruction}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!secondaryQ && mainProblem && (
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-foreground">
                    {mainProblem}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {subInstruction}
                  </p>
                </div>
              </div>
            </div>
          )}

          <input
            type={exercise?.answerType === "NUMERIC" ? "number" : "text"}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={t("lesson.inputPlaceholder")}
            disabled={submitted}
            className={cn(
              "w-full h-12 px-4 text-lg sm:text-xl font-bold text-foreground",
              "bg-card border-2 border-border rounded-xl",
              "focus:border-accent focus:ring-4 focus:ring-accent/20 focus:outline-none",
              "transition-all duration-300 placeholder:text-muted-foreground",
              "disabled:bg-muted disabled:text-muted-foreground"
            )}
          />

          <div className="space-y-3 pt-1">
            <AmautaButton
              onClick={handleSubmit}
              disabled={!answer.trim() || isPending || submitted}
              size="child-lg"
              className="w-full shadow-sm hover:shadow-md"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("lesson.verifying")}
                </span>
              ) : submitted ? (
                t("lesson.submitted")
              ) : (
                t("lesson.submit")
              )}
            </AmautaButton>

            <button
              onClick={onSkip ?? onBack}
              className="w-full text-center text-sm sm:text-base font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 py-2"
            >
              {t("lesson.skip")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <DownloadLesson
        lessonId={title}
        getLessonAssets={() => {
          return [];
        }}
      />
    </AmautaContainer>
  )
}
