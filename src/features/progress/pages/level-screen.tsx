"use client"

import { useEffect, useState } from "react"
import { ChevronRight, Lightbulb, Sparkles, HelpCircle, Trophy, Target, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStudentProgress } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

const DEFAULT_STUDENT_ID = "stu_001"

interface LevelScreenProps {
  studentId?: string
}

export function LevelScreen({ studentId = DEFAULT_STUDENT_ID }: LevelScreenProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { data: progress, isLoading, isError, error, refetch } = useStudentProgress(studentId)

  useEffect(() => {
    setIsVisible(true)
  }, [])

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
          <HelpCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">¡Ups! Algo salió mal</h2>
        <p className="text-slate-500 max-w-xs">{error?.message}</p>
        <Button onClick={() => refetch()} className="bg-[#1f4fa3]">
          Intentar de nuevo
        </Button>
      </div>
    )
  }

  const subjects = progress?.subjects ?? []
  const achievements = progress?.achievements ?? []
  const weakAreas = progress?.weakAreas ?? []

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header with overall progress */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f4fa3] via-[#3d5a80] to-[#f4701f] p-4 sm:p-6 text-white transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold">
            Mi Progreso
          </h1>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="relative">
              <svg className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90">
                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/20" />
                <circle 
                  cx="40" cy="40" r="35" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(progress?.overallProgress ?? 0) * 2.2} 220`}
                  className="text-[#f4701f] transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold">{progress?.overallProgress ?? 0}%</span>
              </div>
            </div>
            <div>
              <p className="text-white/80 text-sm">Progreso general</p>
              <p className="text-xl font-bold">{progress?.studentName ?? 'Estudiante'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className={cn(
        "glass-card rounded-2xl p-4 transition-all duration-700 delay-200",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-[#1f4fa3]" />
          <h2 className="text-lg font-bold text-slate-800">Por Materia</h2>
        </div>
        
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div key={subject.subjectId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-700">{subject.subjectName}</h3>
                  <span className="text-sm font-bold text-slate-600">{Math.round(subject.mastery * 100)}%</span>
                </div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      subject.mastery >= 0.8 ? "bg-green-500" : subject.mastery >= 0.5 ? "bg-blue-500" : "bg-orange-500"
                    )}
                    style={{ width: `${subject.mastery * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-400">{subject.lastPractice}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className={cn(
        "glass-card rounded-2xl p-4 transition-all duration-700 delay-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-800">Logros</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-700 text-sm">{achievement.title}</h3>
                <p className="text-xs text-slate-500">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <div className={cn(
          "glass-card rounded-2xl p-4 transition-all duration-700 delay-400",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-800">Áreas a Mejorar</h2>
          </div>
          
          <div className="space-y-3">
            {weakAreas.map((area) => (
              <div key={area.topicId} className="flex items-start gap-3 p-3 rounded-xl bg-orange-50">
                <Lightbulb className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-slate-700">{area.topicName}</h3>
                  <p className="text-xs text-slate-500">{area.recommendation}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}