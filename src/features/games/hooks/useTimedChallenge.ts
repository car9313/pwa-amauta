import { useState, useCallback, useEffect } from "react"
import { getNextExercise } from "@/services/exercise.service"
import type { Exercise } from "@/features/exercises/domain/exercise.types"

interface UseTimedChallengeReturn {
  currentExercise: Exercise | null
  isLoading: boolean
  score: number
  correctCount: number
  totalAnswered: number
  streak: number
  remainingSeconds: number
  isFinished: boolean
  result: { score: number; correctCount: number; totalCount: number; earnedPoints: number }
  submitAnswer: (answer: string) => Promise<void>
  resetChallenge: () => void
}

const TOTAL_TIME = 60

export function useTimedChallenge(studentId: string): UseTimedChallengeReturn {
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [streak, setStreak] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_TIME)
  const [isFinished, setIsFinished] = useState(false)
  const [result, setResult] = useState({ score: 0, correctCount: 0, totalCount: 0, earnedPoints: 0 })

  const loadExercise = useCallback(async () => {
    setIsLoading(true)
    try {
      const exercise = await getNextExercise(studentId)
      setCurrentExercise(exercise)
    } catch {
      setCurrentExercise(null)
    }
    setIsLoading(false)
  }, [studentId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExercise()
  }, [loadExercise])

  useEffect(() => {
    if (isFinished) return
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsFinished(true)
          const total = totalAnswered
          const correct = correctCount
          setResult({
            score: total > 0 ? Math.round((correct / total) * 100) : 0,
            correctCount: correct,
            totalCount: total,
            earnedPoints: correct * 10 + Math.max(0, Math.floor(correct / 3)) * 5,
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isFinished, totalAnswered, correctCount])

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!currentExercise || isFinished) return

      const isCorrect = answer.trim() === "8"
      setTotalAnswered((p) => p + 1)
      if (isCorrect) {
        setCorrectCount((p) => p + 1)
        setStreak((p) => p + 1)
        setScore((p) => p + 10 + Math.min(streak, 5) * 2)
      } else {
        setStreak(0)
      }

      await loadExercise()
    },
    [currentExercise, isFinished, loadExercise, streak],
  )

  const resetChallenge = useCallback(() => {
    setCurrentExercise(null)
    setIsLoading(true)
    setScore(0)
    setCorrectCount(0)
    setTotalAnswered(0)
    setStreak(0)
    setRemainingSeconds(TOTAL_TIME)
    setIsFinished(false)
    setResult({ score: 0, correctCount: 0, totalCount: 0, earnedPoints: 0 })
    loadExercise()
  }, [loadExercise])

  return {
    currentExercise,
    isLoading,
    score,
    correctCount,
    totalAnswered,
    streak,
    remainingSeconds,
    isFinished,
    result,
    submitAnswer,
    resetChallenge,
  }
}
