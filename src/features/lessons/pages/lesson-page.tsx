"use client"

import { useEffect, useState } from "react"
import { Star, ChevronRight, HelpCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"
import { useNextExercise, useSubmitAnswer } from "@/features/exercises/hooks/useExercise"
import { difficultyToStars } from "@/features/exercises/domain/exercise.types"

// ------------------------------------------------------------
// Props
//
// lessonTitle   → viene del AgendaItem cuando el estudiante
//                 hace clic en "Iniciar" en el dashboard
// topicHint     → viene del AgendaItem, se envía al API
// sessionId     → TODO: confirmar con backend cómo obtenerlo
// stepTotal     → TODO: llegará del API cuando esté listo.
//                 Por ahora se pasa como prop desde el dashboard
//                 usando el total de steps del Lesson estático.
// ------------------------------------------------------------
interface LessonPageProps {
  studentId?:   string
  sessionId?:   string
  lessonTitle?: string
  topicHint?:   string
  stepTotal?:   number
  initialStep?: number  // paso actual (opcional, para lecciones en progreso)
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
  const [isVisible, setIsVisible]   = useState(false)
  const [answer, setAnswer]         = useState("")
  const [submitted, setSubmitted]   = useState(false)
  // stepCurrent viene de los props o del API
  // TODO: cuando el API devuelva step_current y step_total,
  // estos valores vendrán de exercise.stepCurrent / exercise.stepTotal

  const { data: exercise, isLoading, isError, error } = useNextExercise(
    studentId,
)

  const { mutate: submitAnswer, isPending } = useSubmitAnswer(studentId)

  useEffect(() => { setIsVisible(true) }, [])

  const handleSubmit = () => {
    if (!answer.trim() || submitted || !exercise) return
    setSubmitted(true)
    submitAnswer(
      { exerciseId: exercise.exerciseId, answer },
      {
        onSuccess: () => {
          // TODO: navegar a FeedbackPage pasando el ExerciseResult
          // onNext(result)
        },
      }
    )
  }

  // ─── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#f4701f]/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-[#f4701f]/30 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#f4701f] animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center text-4xl">
          😢
        </div>
        <h2 className="text-xl font-bold text-slate-700">¡Ups! Algo salió mal</h2>
        <p className="text-slate-500 max-w-xs">
          {(error as any)?.message ?? "No pudimos cargar el ejercicio. Intenta de nuevo."}
        </p>
        <Button onClick={onBack} className="bg-[#1f4fa3]">
          Volver al inicio
        </Button>
      </div>
    )
  }

  // ─── Datos derivados ───────────────────────────────────────
  // Mapeamos los campos del API a lo que la UI necesita.
  // Los campos marcados con TODO esperan confirmación del backend.

  const title          = lessonTitle ?? exercise?.topicId ?? "Lección"
  const starsCount     = difficultyToStars(exercise?.difficulty ?? "MEDIUM")
  const currentStep    = exercise?.stepCurrent   ?? initialStep   // TODO: del API
  const totalSteps     = exercise?.stepTotal     ?? stepTotal      // TODO: del API

  // "Resuelve:" — el problema principal
  const mainProblem    = exercise?.prompt ?? ""

  // Explicación pedagógica — hints[0]
  const explanation    = exercise?.hints?.[0] ?? ""

  // Pizarra oscura — TODO: será exercise.demoContent cuando el API lo incluya
  // Por ahora: hints[1] como fallback temporal
  const demoContent    = exercise?.demoContent ?? exercise?.hints?.[1] ?? null

  // Pregunta secundaria — TODO: será exercise.secondaryQuestion
  // Por ahora no se muestra si no hay dato (la sección queda oculta)
  const secondaryQ     = exercise?.secondaryQuestion ?? null

  // Instrucción debajo de la pregunta — TODO: será exercise.subInstruction
  const subInstruction = exercise?.subInstruction ?? "¡Hazlo como en la pizarra!"

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 pb-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-[#1f4fa3] transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Inicio
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">Lección</span>
      </div>

      {/* Card principal */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100",
          "transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <div className="p-5 sm:p-6 space-y-5">

          {/* ── Header: título + dificultad + paso ── */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {/* Estrellas de dificultad */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Dificultad:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                        star <= starsCount
                          ? "text-[#f4701f] fill-[#f4701f]"
                          : "text-slate-200 fill-slate-200"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              {/* Paso X de Y */}
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Paso{" "}
                <span className="text-[#1f4fa3] font-bold">{currentStep}</span>
                {" "}de{" "}
                <span className="text-[#1f4fa3] font-bold">{totalSteps}</span>
              </span>
            </div>
          </div>

          {/* ── Sección "Resuelve:" ── */}
          {mainProblem && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">

              {/* Problema principal */}
              <p className="text-sm sm:text-base text-slate-700 font-medium">
                Resuelve:{" "}
                <span className="text-lg sm:text-2xl font-bold text-slate-800">
                  {mainProblem}
                </span>
              </p>

              {/* Explicación pedagógica (hints[0]) */}
              {explanation && (
                <p className="text-sm text-slate-600">{explanation}</p>
              )}

              {/* Pizarra oscura de demostración */}
              {/* TODO: reemplazar por exercise.demoContent cuando el API lo tenga */}
              {demoContent ? (
                <div className="bg-[#17306d] rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
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
                /* Placeholder mientras el API no devuelva demoContent */
                <div className="bg-[#17306d] rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
                  <p className="text-white/50 text-sm italic">
                    {/* demo_content pendiente del backend */}
                    Demostración visual próximamente
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

          {/* ── Sección de pregunta secundaria ── */}
          {/* TODO: cuando el API devuelva secondary_question, mostrar aquí */}
          {/* Por ahora se muestra solo si existe en el exercise */}
          {secondaryQ && (
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f4701f] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-slate-700">
                    {secondaryQ}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {subInstruction}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Si no hay secondary_question del API, mostramos el prompt
               como pregunta de respuesta (comportamiento provisional) ── */}
          {!secondaryQ && mainProblem && (
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f4701f] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-slate-700">
                    {/* TODO: reemplazar por exercise.secondaryQuestion */}
                    {mainProblem}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {subInstruction}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Input de respuesta ── */}
          <input
            type={exercise?.answerType === "NUMERIC" ? "number" : "text"}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ej: 15/8"
            disabled={submitted}
            className={cn(
              "w-full h-12 sm:h-14 px-4 text-lg sm:text-xl font-bold text-slate-800",
              "bg-white border-2 border-slate-200 rounded-xl",
              "focus:border-[#f4701f] focus:ring-4 focus:ring-[#f4701f]/20 focus:outline-none",
              "transition-all duration-300 placeholder:text-slate-300",
              "disabled:bg-slate-100 disabled:text-slate-400"
            )}
          />

          {/* ── Botones ── */}
          <div className="space-y-3 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={!answer.trim() || isPending || submitted}
              className={cn(
                "w-full h-12 sm:h-14 text-base sm:text-lg font-bold",
                "bg-[#1f4fa3] hover:bg-[#17306d]",
                "shadow-sm hover:shadow-md transition-all duration-200",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : submitted ? (
                "¡Respuesta enviada!"
              ) : (
                "Contestar"
              )}
            </Button>

            <button
              onClick={onSkip ?? onBack}
              className="w-full text-center text-sm sm:text-base font-medium text-[#1f4fa3] hover:text-[#17306d] transition-colors flex items-center justify-center gap-1 py-2"
            >
              Saltar paso
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
