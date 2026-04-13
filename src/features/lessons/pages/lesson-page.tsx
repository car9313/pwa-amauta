"use client"

import { useEffect, useState } from "react"
import { Star, ChevronRight, HelpCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNextExercise, useSubmitAnswer } from "@/hooks/useExercise"
import { cn } from "@/lib/utils"

interface LessonPageProps {
  studentId?: string
  onBack?: () => void
}

const DEFAULT_STUDENT_ID = "stu_445"

export function LessonPage({ studentId = DEFAULT_STUDENT_ID, onBack }: LessonPageProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [answer, setAnswer] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const { data: exercise, isLoading, isError, error } = useNextExercise(studentId)
  const { mutate: submitAnswer, isPending } = useSubmitAnswer(studentId)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = () => {
    if (!answer.trim() || submitted) return
    setSubmitted(true)
    submitAnswer(
      { exerciseId: exercise?.exerciseId ?? "", answer },
      {
        onSuccess: () => {
          // El resultado se maneja en el componente
        },
      }
    )
  }

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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
        <div className="relative w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-4xl">😢</span>
        </div>
        <h2 className="text-xl font-bold text-slate-700">¡Ups! Algo salió mal</h2>
        <p className="text-slate-500 max-w-xs">
          {error?.message || "No pudimos cargar el ejercicio. Intenta de nuevo."}
        </p>
        <Button onClick={onBack} className="bg-[#1f4fa3]">
          Volver al inicio
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">

      {/* Main Lesson Card - Glass + Atmospheric */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-white shadow-lg transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {/* Atmospheric decoration */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#1f4fa3]/5 to-[#f4701f]/5 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-[#f4701f]/5 blur-xl" />

        <div className="relative z-10 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div
            className={cn(
              "space-y-3 sm:space-y-4 transition-all duration-500 delay-100",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight">
              {exercise?.title ?? "División con fracciones"}
            </h1>

            {/* Difficulty + Step */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-slate-500">Dificultad:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star, index) => (
                    <button
                      key={star}
                      className={cn(
                        "transition-all duration-300 hover:scale-125",
                        star <= (exercise?.difficulty ?? 3)
                          ? "text-[#f4701f] fill-[#f4701f]"
                          : "text-slate-200"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Paso{' '}
                <span className="text-[#1f4fa3] font-bold">
                  {exercise?.stepCurrent ?? 1}
                </span>
                {' '}de{' '}
                <span className="text-[#1f4fa3] font-bold">
                  {exercise?.stepTotal ?? 3}
                </span>
              </span>
            </div>
          </div>

          {/* Problem Section - Gradient mesh */}
          <div
            className={cn(
              "relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-500 delay-200",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20" />

            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-[#1f4fa3]/5 blur-xl" />
              <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full bg-[#f4701f]/5 blur-lg" />
            </div>

            <div className="relative z-10">
              <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4 font-medium">
                Resuelve:{' '}
                <span className="text-xl sm:text-2xl font-bold text-slate-800">
                  {exercise?.question ?? "³/₄ ÷ ⁷/₅ ="}
                </span>
              </p>

              {/* Hint + Demonstration */}
              {exercise?.hint && (
                <div className="bg-[#17306d]/95 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-white/70 mb-1">Pista:</p>
                    <p className="text-sm sm:text-base text-white font-medium">
                      {exercise.hint}
                    </p>
                  </div>

                  {/* Mascot */}
                  <div className="hidden sm:block w-16 h-16 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                    <img
                      src="/img/amauta-mascot.jpg"
                      alt="Amauta"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question Input - Glass + Focus animation */}
          <div
            className={cn(
              "relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-500 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl sm:rounded-2xl" />

            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#f4701f] mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-sm sm:text-base font-semibold text-slate-700">
                    Ingresa tu respuesta:{' '}
                    <span className="text-xl sm:text-2xl font-bold">
                      {exercise?.question ? '?' : ''}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Simplifica si es posible
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
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
            </div>
          </div>

          {/* Actions */}
          <div
            className={cn(
              "space-y-3 pt-2 transition-all duration-500 delay-400",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <Button
              onClick={handleSubmit}
              disabled={!answer.trim() || isPending || submitted}
              className={cn(
                "w-full h-12 sm:h-14 text-base sm:text-lg font-bold",
                "bg-gradient-to-r from-[#f4701f] to-[#ea601b]",
                "hover:from-[#ea601b] hover:to-[#d45518]",
                "shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30",
                "hover:scale-[1.02] transition-all duration-300",
                "disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
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
              onClick={onBack}
              className="w-full text-center text-sm sm:text-base font-medium text-slate-500 hover:text-[#1f4fa3] transition-colors flex items-center justify-center gap-2 py-2"
            >
              Saltar paso{' '}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Mastery indicator */}
      <div
        className={cn(
          "text-center transition-all duration-500 delay-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 rounded-full">
          <div className="w-2 h-2 rounded-full bg-[#f4701f] animate-pulse" />
          <span className="text-xs sm:text-sm text-slate-600 font-medium">
            Nivel de dominio:{' '}
            <span className="text-[#f4701f] font-bold">
              {exercise?.masteryBand ?? 'LOW'}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}