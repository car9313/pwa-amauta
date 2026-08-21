"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronRight } from "lucide-react"
import { AmautaContainer, AmautaErrorState, AmautaLoadingState } from "@/components/amauta"

import { cn } from "@/lib/utils"
import { fireCorrectBurst } from "@/lib/effects/confetti"
import {
  playCorrectSound,
  playVictoryFanfare,
  playWrongSound,
  speakText,
} from "@/lib/sound/sound"
import { getProgressByStudentAndLesson } from "@/lib/api/storage/progress-db"
import {
  exerciseKeys,
  progressKeys,
} from "@/lib/query/keys"
import { QUEUED_OFFLINE } from "@/lib/sync/useSafeMutation"
import { DownloadLesson } from "@/components/DownloadLesson"
import { useBreakpoint } from "@/hooks/useBreakpoint"
import { getNextExercise } from "@/services/exercise.service"
import { difficultyToStars } from "@/features/exercises/domain/exercise.types"
import type { ExerciseResult, ExerciseType } from "@/features/exercises/domain/exercise.types"
import {
  XP_PER_CORRECT,
  computeLevelFromPoints,
  computeNextStreakDays,
} from "@/features/exercises/domain/gamification.utils"
import { useNextExercise, useSubmitAnswer } from "@/features/exercises/hooks/useExercise"
import {
  useConceptMasteryForTopic,
  useRecordConceptAttempt,
} from "@/features/exercises/hooks/useConceptMastery"
import { useProgressByStudentAndLesson, useUpdateProgress } from "@/features/exercises/hooks/useProgress"
import { LessonHeader } from "@/features/lessons/components/exercise/lesson-header"
import { MascotFeedback } from "@/features/lessons/components/exercise/mascot-feedback"
import { QuestionCard } from "@/features/lessons/components/exercise/question-card"
import type { LessonExerciseStatus, LessonSessionSummary } from "@/features/lessons/domain/lesson-session.types"
import { useAuthStore } from "@/features/auth/presentation/store/auth-store"

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
const AUTO_ADVANCE_MS = 1900

const SUBJECT_BY_EXERCISE_TYPE: Record<ExerciseType, string> = {
  VISUAL_ADDITION: "math",
  VISUAL_SUBTRACTION: "math",
  VISUAL_MULTIPLICATION: "math",
  VISUAL_DIVISION: "math",
  TEXT_PROBLEM: "math",
  INTERACTIVE: "math",
}

interface LessonSessionState {
  status: LessonExerciseStatus
  selectedAnswer: string | null
  inputValue: string
  result: ExerciseResult | null
  xpEarnedThisSession: number
  attemptedExerciseIds: string[]
  firstTryCorrectCount: number
}

type LessonSessionAction =
  | { type: "START_CHECKING"; answer: string }
  | { type: "SET_INPUT"; value: string }
  | { type: "RESOLVE"; result: ExerciseResult; exerciseId: string }
  | { type: "ADVANCE" }

const initialSessionState: LessonSessionState = {
  status: "idle",
  selectedAnswer: null,
  inputValue: "",
  result: null,
  xpEarnedThisSession: 0,
  attemptedExerciseIds: [],
  firstTryCorrectCount: 0,
}

function sessionReducer(
  state: LessonSessionState,
  action: LessonSessionAction
): LessonSessionState {
  switch (action.type) {
    case "START_CHECKING":
      return { ...state, status: "checking", selectedAnswer: action.answer }

    case "SET_INPUT":
      return { ...state, inputValue: action.value }

    case "RESOLVE": {
      const isFirstAttempt = !state.attemptedExerciseIds.includes(action.exerciseId)
      const passed = action.result.passed

      return {
        ...state,
        status: passed ? "correct" : "incorrect",
        result: action.result,
        xpEarnedThisSession: state.xpEarnedThisSession + (passed ? XP_PER_CORRECT : 0),
        firstTryCorrectCount:
          state.firstTryCorrectCount + (passed && isFirstAttempt ? 1 : 0),
        attemptedExerciseIds: [...state.attemptedExerciseIds, action.exerciseId],
      }
    }

    case "ADVANCE":
      return {
        ...state,
        status: "idle",
        selectedAnswer: null,
        inputValue: "",
        result: null,
      }

    default:
      return state
  }
}

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
  const { isTabletOrDesktop } = useBreakpoint()

  const [session, dispatch] = useReducer(sessionReducer, initialSessionState)
  const [showHint, setShowHint] = useState(false)

  const isFirstAttemptRef = useRef(true)
  const autoAdvanceTimerRef = useRef<number | null>(null)

  const { data: exercise, isLoading, isError, error } = useNextExercise(studentId)
  const { mutate: submitAnswer } = useSubmitAnswer(studentId)
  const { mutateAsync: recordAttempt } = useRecordConceptAttempt()
  const { mutate: updateProgress } = useUpdateProgress()

  const topicId = exercise?.topicId ?? null
  const { data: mastery } = useConceptMasteryForTopic(studentId, topicId)
  const { data: lessonProgress } = useProgressByStudentAndLesson(studentId, topicId ?? "")

  const clearAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current)
      autoAdvanceTimerRef.current = null
    }
  }, [])

  const advance = useCallback(() => {
    clearAutoAdvanceTimer()
    setShowHint(false)
    dispatch({ type: "ADVANCE" })
    void queryClient.invalidateQueries({
      queryKey: exerciseKeys.next(studentId, tenantId),
    })
  }, [clearAutoAdvanceTimer, queryClient, studentId, tenantId])

  useEffect(() => {
    if (session.status !== "correct") return
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      advance()
    }, AUTO_ADVANCE_MS)
    return clearAutoAdvanceTimer
  }, [session.status, advance, clearAutoAdvanceTimer])

  useEffect(() => clearAutoAdvanceTimer, [clearAutoAdvanceTimer])

  const prefetchNextExercise = () => {
    void queryClient.prefetchQuery({
      queryKey: exerciseKeys.next(studentId, tenantId),
      queryFn: () => getNextExercise(studentId),
      staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    })
  }

  const applyProgressReward = async (passed: boolean, progressBucketId: string) => {
    try {
      const current = await getProgressByStudentAndLesson(studentId, progressBucketId)
      const nextPoints = (current?.points ?? 0) + (passed ? XP_PER_CORRECT : 0)

      updateProgress({
        studentId,
        lessonId: progressBucketId,
        updates: {
          points: nextPoints,
          level: computeLevelFromPoints(nextPoints),
          streakDays: computeNextStreakDays(current?.lastPlayedAt, current?.streakDays),
        },
      })
    } catch {
      return
    }
  }

  const handleResolve = (data: ExerciseResult | typeof QUEUED_OFFLINE) => {
    if (data === QUEUED_OFFLINE) {
      navigate("/lessons/feedback", { state: { queued: true }, replace: true })
      return
    }
    if (!exercise) return

    const exerciseStepCurrent = exercise.stepCurrent ?? initialStep
    const exerciseStepTotal = exercise.stepTotal ?? stepTotal
    const isLessonComplete =
      data.passed && exerciseStepCurrent >= exerciseStepTotal

    dispatch({ type: "RESOLVE", result: data, exerciseId: exercise.exerciseId })

    if (isLessonComplete) {
      clearAutoAdvanceTimer()
      playVictoryFanfare()

      void recordAttempt({
        studentId,
        topicId: exercise.topicId,
        subject: SUBJECT_BY_EXERCISE_TYPE[exercise.type],
        isCorrect: data.passed,
        isFirstAttempt: isFirstAttemptRef.current,
      })
      void applyProgressReward(data.passed, exercise.topicId)

      const summary: LessonSessionSummary = {
        xpEarned: session.xpEarnedThisSession + XP_PER_CORRECT,
        firstTryCorrectCount:
          session.firstTryCorrectCount + (isFirstAttemptRef.current ? 1 : 0),
        totalAttempts: session.attemptedExerciseIds.length + 1,
        topicId: exercise.topicId,
      }

      navigate("/lessons/feedback", { state: { summary }, replace: true })
      return
    }

    if (data.passed) {
      playCorrectSound()
      fireCorrectBurst()
    } else {
      playWrongSound()
    }

    speakText(data.passed ? t("lesson.correctTitle") : data.feedbackSummary || t("lesson.incorrectTitle"))

    void recordAttempt({
      studentId,
      topicId: exercise.topicId,
      subject: SUBJECT_BY_EXERCISE_TYPE[exercise.type],
      isCorrect: data.passed,
      isFirstAttempt: isFirstAttemptRef.current,
    })

    void applyProgressReward(data.passed, exercise.topicId)

    if (!data.passed && data.nextAction.action === "REMEDIATE") {
      prefetchNextExercise()
    }
  }

  const startChecking = (answer: string) => {
    if (!exercise || session.status !== "idle") return
    isFirstAttemptRef.current = !session.attemptedExerciseIds.includes(exercise.exerciseId)
    dispatch({ type: "START_CHECKING", answer })

    submitAnswer(
      { exerciseId: exercise.exerciseId, answer },
      { onSuccess: handleResolve }
    )
  }

  const handleSelectOption = (option: string) => {
    startChecking(option)
  }

  const handleSubmitInput = () => {
    if (!session.inputValue.trim()) return
    startChecking(session.inputValue.trim())
  }

  if (isLoading) {
    return <AmautaLoadingState variant="page" />
  }

  if (isError || !exercise) {
    return (
      <AmautaErrorState
        title={t("lesson.errorTitle")}
        message={(error instanceof Error ? error.message : null) ?? t("lesson.errorMessage")}
        onRetry={onBack}
        retryLabel={t("lesson.goHome")}
      />
    )
  }

  const title       = lessonTitle ?? exercise.topicId ?? t("lesson.title")
  const starsCount  = difficultyToStars(exercise.difficulty)
  const currentStep = exercise.stepCurrent ?? initialStep
  const totalSteps  = exercise.stepTotal ?? stepTotal

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
        className={cn(
          "grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch animate-fade-in-up",
          !isTabletOrDesktop && "pb-24"
        )}
      >
        {isTabletOrDesktop && (
          <aside className="md:col-span-5 rounded-[28px] bg-gradient-to-b from-primary/10 via-primary/5 to-accent/10 border border-border shadow-sm overflow-hidden min-h-[440px]">
            <MascotFeedback
              status={session.status}
              layoutMode="sidebar"
              explanationMessage={session.result?.feedbackSummary ?? null}
              xpEarnedThisSession={session.xpEarnedThisSession}
              masteryLevel={mastery?.masteryLevel ?? null}
              confidenceStage={mastery?.confidenceStage ?? null}
              onContinue={advance}
            />
          </aside>
        )}

        <section className={cn("space-y-4", isTabletOrDesktop && "md:col-span-7")}>
          <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
            <div className="p-5 sm:p-6 space-y-6">
              <LessonHeader
                title={title}
                difficultyStars={starsCount}
                stepCurrent={currentStep}
                stepTotal={totalSteps}
                xpEarnedThisSession={session.xpEarnedThisSession}
                streakDays={lessonProgress?.streakDays ?? null}
                masteryLevel={mastery?.masteryLevel ?? null}
                confidenceStage={mastery?.confidenceStage ?? null}
              />

              <QuestionCard
                prompt={exercise.prompt}
                answerType={exercise.answerType}
                options={exercise.options}
                hints={exercise.hints}
                subInstruction={exercise.subInstruction ?? undefined}
                selectedAnswer={session.selectedAnswer}
                inputValue={session.inputValue}
                status={session.status}
                showHint={showHint}
                onListen={() => speakText(exercise.prompt)}
                onSelectOption={handleSelectOption}
                onInputChange={(value) => dispatch({ type: "SET_INPUT", value })}
                onSubmitInput={handleSubmitInput}
                onToggleHint={() => setShowHint((prev) => !prev)}
                onContinue={advance}
              />

              <div className="pt-1">
                <button
                  onClick={onSkip ?? advance}
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
        </section>
      </div>

      {!isTabletOrDesktop && (
        <MascotFeedback
          status={session.status}
          layoutMode="sheet"
          explanationMessage={session.result?.feedbackSummary ?? null}
          xpEarnedThisSession={session.xpEarnedThisSession}
          masteryLevel={mastery?.masteryLevel ?? null}
          confidenceStage={mastery?.confidenceStage ?? null}
          onContinue={advance}
        />
      )}
    </AmautaContainer>
  )
}
