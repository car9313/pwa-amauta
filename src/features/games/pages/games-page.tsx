import { useEffect, useState, useCallback } from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { GAME_CONFIGS } from "../domain/game-config"
import { useMemoryGame } from "../hooks/useMemoryGame"
import { GameCard } from "../components/game-card"
import { MemoryBoard, MemoryStats } from "../components/memory-board"
import { GameResultScreen } from "../components/game-result"
import { TimedChallengeView } from "../components/timed-challenge"
import { QuizGameView } from "../components/quiz-game"
import { useQuizGame } from "../hooks/useQuizGame"
import type { GameView, GameId, GameResult } from "../domain/game.types"

function TimedChallengeWrapper({ onBack }: { onBack: () => void }) {
  const [dummy] = useState(0)
  void dummy
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [streak, setStreak] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const [isFinished, setIsFinished] = useState(false)
  const [prompt, setPrompt] = useState("8 + 5 = ?")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)

  const ops = ["+", "-", "x"]
  const generatePrompt = useCallback(() => {
    const op = ops[Math.floor(Math.random() * 3)]
    let a: number
    let b: number
    if (op === "+") {
      a = Math.floor(Math.random() * 15) + 3
      b = Math.floor(Math.random() * 10) + 1
    } else if (op === "-") {
      a = Math.floor(Math.random() * 15) + 10
      b = Math.floor(Math.random() * (a - 1)) + 1
    } else {
      a = Math.floor(Math.random() * 7) + 2
      b = Math.floor(Math.random() * 7) + 2
    }
    let expected: number
    if (op === "+") expected = a + b
    else if (op === "-") expected = a - b
    else expected = a * b
    return { text: `${a} ${op} ${b} = ?`, answer: String(expected) }
  }, [ops])

  const currentRef = useState(generatePrompt)[0]
  const [current, setCurrent] = useState(currentRef)

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
            gameId: "timed",
            score: total > 0 ? Math.round((correct / total) * 100) : 0,
            correctCount: correct,
            totalCount: total,
            timeSeconds: 60,
            earnedPoints: correct * 10 + Math.floor(correct / 3) * 5,
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isFinished, totalAnswered, correctCount])

  const handleSubmit = useCallback(
    async (answer: string) => {
      if (isFinished) return
      const isCorrect = answer.trim() === current.answer
      setTotalAnswered((p) => p + 1)
      if (isCorrect) {
        setCorrectCount((p) => p + 1)
        setStreak((p) => p + 1)
        setScore((p) => p + 10 + Math.min(streak, 5) * 2)
      } else {
        setStreak(0)
      }
      const next = generatePrompt()
      setCurrent(next)
    },
    [isFinished, current, streak, generatePrompt],
  )

  const resetChallenge = useCallback(() => {
    setScore(0)
    setCorrectCount(0)
    setTotalAnswered(0)
    setStreak(0)
    setRemainingSeconds(60)
    setIsFinished(false)
    setResult(null)
    setCurrent(generatePrompt())
  }, [generatePrompt])

  return (
    <TimedChallengeView
      score={score}
      correctCount={correctCount}
      totalAnswered={totalAnswered}
      streak={streak}
      remainingSeconds={remainingSeconds}
      isFinished={isFinished}
      prompt={current.text}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onBack={onBack}
      onReset={resetChallenge}
      result={result}
    />
  )
}

export function GamesPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentView, setCurrentView] = useState<GameView>("portal")
  const [memoryDifficulty] = useState<"easy" | "medium" | "hard">("easy")

  const memory = useMemoryGame(memoryDifficulty)
  const quiz = useQuizGame(10)

  useEffect(() => { setIsVisible(true) }, [])

  const handleSelectGame = (id: GameId) => {
    setCurrentView(id)
  }

  const handleBackToPortal = () => {
    setCurrentView("portal")
  }

  const memoryResult: GameResult | null = memory.result
  const quizResult = quiz.result

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <div
        className={cn(
          "transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        {currentView === "portal" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">!Juguemos!</h1>
                <p className="text-sm text-slate-500">Elige un juego para aprender matemáticas</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GAME_CONFIGS.map((config) => (
                <GameCard key={config.id} config={config} onClick={handleSelectGame} />
              ))}
            </div>
          </div>
        )}

        {currentView === "memory" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToPortal}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1f4fa3] transition-colors"
              >
                Volver
              </button>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Memoria Matematica</h2>
              <div className="w-16" />
            </div>

            {memory.isFinished && memoryResult ? (
              <GameResultScreen
                result={memoryResult}
                onPlayAgain={memory.resetGame}
                onHome={handleBackToPortal}
              />
            ) : (
              <div className="space-y-4">
                <MemoryStats
                  matchedPairs={memory.matchedPairs}
                  totalPairs={memory.totalPairs}
                  attempts={memory.attempts}
                  elapsedSeconds={memory.elapsedSeconds}
                />
                <MemoryBoard
                  cards={memory.cards}
                  onFlip={memory.flipCard}
                  difficulty={memoryDifficulty}
                />
              </div>
            )}
          </div>
        )}

        {currentView === "timed" && (
          <TimedChallengeWrapper onBack={handleBackToPortal} />
        )}

        {currentView === "quiz" && (
          <QuizGameView
            currentQuestion={quiz.currentQuestion}
            currentIndex={quiz.currentIndex}
            totalCount={10}
            score={quiz.score}
            correctCount={quiz.correctCount}
            selectedOption={quiz.selectedOption}
            showFeedback={quiz.showFeedback}
            isCorrect={quiz.isCorrect}
            isFinished={quiz.isFinished}
            result={quizResult}
            onSelectOption={quiz.selectOption}
            onNext={quiz.nextQuestion}
            onBack={handleBackToPortal}
            onReset={quiz.resetQuiz}
          />
        )}
      </div>
    </div>
  )
}
