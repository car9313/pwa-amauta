import { useState, useCallback, useEffect, useRef } from "react"
import type { MemoryCard, MemoryDifficulty, GameResult } from "../domain/game.types"
import { generatePairs } from "../domain/game-config"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface UseMemoryGameReturn {
  cards: MemoryCard[]
  flippedIndices: number[]
  matchedPairs: number
  totalPairs: number
  attempts: number
  isFinished: boolean
  elapsedSeconds: number
  result: GameResult | null
  flipCard: (index: number) => void
  resetGame: () => void
}

export function useMemoryGame(difficulty: MemoryDifficulty = "easy"): UseMemoryGameReturn {
  const pairs = generatePairs(difficulty)
  const totalPairs = pairs.length

  const buildCards = useCallback((): MemoryCard[] => {
    const cards: MemoryCard[] = []
    pairs.forEach((pair, i) => {
      cards.push({
        id: `expr-${i}`,
        pairId: `pair-${i}`,
        content: pair.expression,
        isFlipped: false,
        isMatched: false,
      })
      cards.push({
        id: `res-${i}`,
        pairId: `pair-${i}`,
        content: pair.result,
        isFlipped: false,
        isMatched: false,
      })
    })
    return shuffle(cards)
  }, [pairs])

  const [cards, setCards] = useState<MemoryCard[]>(buildCards)
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [startTime] = useState(Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)
  const lockRef = useRef(false)

  useEffect(() => {
    if (isFinished) return
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, isFinished])

  const flipCard = useCallback(
    (index: number) => {
      if (lockRef.current) return
      if (cards[index].isFlipped || cards[index].isMatched) return
      if (flippedIndices.length >= 2) return

      const newCards = [...cards]
      newCards[index] = { ...newCards[index], isFlipped: true }
      setCards(newCards)

      const newFlipped = [...flippedIndices, index]
      setFlippedIndices(newFlipped)

      if (newFlipped.length === 2) {
        lockRef.current = true
        setAttempts((p) => p + 1)

        const first = cards[newFlipped[0]]
        const second = cards[newFlipped[1]]

        if (first.pairId === second.pairId) {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) => (c.pairId === first.pairId ? { ...c, isMatched: true } : c)),
            )
            const newMatched = matchedPairs + 1
            setMatchedPairs(newMatched)
            setFlippedIndices([])
            lockRef.current = false

            if (newMatched === totalPairs) {
              const elapsed = Math.floor((Date.now() - startTime) / 1000)
              setIsFinished(true)
              setElapsedSeconds(elapsed)
              setResult({
                gameId: "memory",
                score: Math.round((totalPairs / attempts) * 100),
                correctCount: totalPairs,
                totalCount: totalPairs,
                timeSeconds: elapsed,
                earnedPoints: Math.max(10, Math.round((totalPairs / attempts) * 50)),
              })
            }
          }, 400)
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c, i) =>
                i === newFlipped[0] || i === newFlipped[1] ? { ...c, isFlipped: false } : c,
              ),
            )
            setFlippedIndices([])
            lockRef.current = false
          }, 800)
        }
      }
    },
    [cards, flippedIndices, matchedPairs, totalPairs, attempts, startTime],
  )

  const resetGame = useCallback(() => {
    setCards(buildCards())
    setFlippedIndices([])
    setMatchedPairs(0)
    setAttempts(0)
    setIsFinished(false)
    setElapsedSeconds(0)
    setResult(null)
    lockRef.current = false
  }, [buildCards])

  return {
    cards,
    flippedIndices,
    matchedPairs,
    totalPairs,
    attempts,
    isFinished,
    elapsedSeconds,
    result,
    flipCard,
    resetGame,
  }
}
