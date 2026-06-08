import { useState, useCallback } from "react"
import type { QuizQuestion, GameResult } from "../domain/game.types"
import { generateQuizQuestions } from "../domain/game-config"

interface UseQuizGameReturn {
  questions: QuizQuestion[]
  currentIndex: number
  currentQuestion: QuizQuestion | null
  score: number
  correctCount: number
  totalAnswered: number
  isFinished: boolean
  selectedOption: number | null
  showFeedback: boolean
  isCorrect: boolean | null
  result: GameResult | null
  selectOption: (index: number) => void
  nextQuestion: () => void
  resetQuiz: () => void
}

export function useQuizGame(questionCount = 10): UseQuizGameReturn {
  const allQuestions = generateQuizQuestions(questionCount)

  const [questions] = useState<QuizQuestion[]>(allQuestions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const currentQuestion = currentIndex < questions.length ? questions[currentIndex] : null

  const selectOption = useCallback(
    (index: number) => {
      if (showFeedback || !currentQuestion) return
      setSelectedOption(index)
      setShowFeedback(true)

      const correct = index === currentQuestion.correctIndex
      setIsCorrect(correct)
      setTotalAnswered((p) => p + 1)

      if (correct) {
        setCorrectCount((p) => p + 1)
        setScore((p) => p + 10)
      }
    },
    [showFeedback, currentQuestion],
  )

  const nextQuestion = useCallback(() => {
    const next = currentIndex + 1
    if (next >= questions.length) {
      setIsFinished(true)
      return
    }
    setCurrentIndex(next)
    setSelectedOption(null)
    setShowFeedback(false)
    setIsCorrect(null)
  }, [currentIndex, questions.length])

  const resetQuiz = useCallback(() => {
    const fresh = generateQuizQuestions(questionCount)
    ;(questions as QuizQuestion[]).splice(0, questions.length, ...fresh)
    setCurrentIndex(0)
    setScore(0)
    setCorrectCount(0)
    setTotalAnswered(0)
    setIsFinished(false)
    setSelectedOption(null)
    setShowFeedback(false)
    setIsCorrect(null)
  }, [questionCount, questions])

  const result: GameResult | null =
    isFinished && totalAnswered > 0
      ? {
          gameId: "quiz",
          score: Math.round((correctCount / totalAnswered) * 100),
          correctCount,
          totalCount: questions.length,
          timeSeconds: Math.round(currentIndex * 8),
          earnedPoints: correctCount * 10,
        }
      : null

  return {
    questions,
    currentIndex,
    currentQuestion,
    score,
    correctCount,
    totalAnswered,
    isFinished,
    selectedOption,
    showFeedback,
    isCorrect,
    result,
    selectOption,
    nextQuestion,
    resetQuiz,
  }
}
