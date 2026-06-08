import type { Exercise } from "@/features/exercises/domain/exercise.types"

export type GameId = "memory" | "timed" | "quiz"

export interface GameConfig {
  id: GameId
  title: string
  description: string
  icon: string
  color: string
  bgClass: string
  estimatedMinutes: number
}

export type GameView = "portal" | GameId

export interface MemoryCard {
  id: string
  pairId: string
  content: string
  isFlipped: boolean
  isMatched: boolean
}

export type MemoryDifficulty = "easy" | "medium" | "hard"

export interface MemoryConfig {
  pairs: number
  cols: number
  timeSeconds: number
  exercises: Exercise[]
}

export interface TimedChallengeState {
  currentExercise: Exercise | null
  exerciseIndex: number
  score: number
  correctCount: number
  totalAnswered: number
  streak: number
  remainingSeconds: number
  isFinished: boolean
  answers: { correct: boolean; answer: string; exerciseId: string }[]
}

export interface QuizQuestion {
  prompt: string
  options: string[]
  correctIndex: number
}

export interface QuizGameState {
  questions: QuizQuestion[]
  currentIndex: number
  score: number
  correctCount: number
  totalAnswered: number
  isFinished: boolean
  selectedOption: number | null
  showFeedback: boolean
  answers: { correct: boolean; questionIndex: number }[]
}

export interface GameResult {
  gameId: GameId
  score: number
  correctCount: number
  totalCount: number
  timeSeconds: number
  earnedPoints: number
}
