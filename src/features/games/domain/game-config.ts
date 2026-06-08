import type { GameConfig } from "./game.types"

export const GAME_CONFIGS: GameConfig[] = [
  {
    id: "memory",
    title: "Memoria Matemática",
    description: "Encuentra los pares de operaciones y resultados",
    icon: "grid",
    color: "#1f4fa3",
    bgClass: "bg-blue-50",
    estimatedMinutes: 5,
  },
  {
    id: "timed",
    title: "Reto Contrarreloj",
    description: "Responde la mayor cantidad en 60 segundos",
    icon: "timer",
    color: "#f4701f",
    bgClass: "bg-orange-50",
    estimatedMinutes: 2,
  },
  {
    id: "quiz",
    title: "Quiz de Opción Múltiple",
    description: "Elige la respuesta correcta entre 4 opciones",
    icon: "help-circle",
    color: "#059669",
    bgClass: "bg-emerald-50",
    estimatedMinutes: 5,
  },
]

export function generatePairs(difficulty: "easy" | "medium" | "hard"): { expression: string; result: string }[] {
  const pairs: { expression: string; result: string }[] = []

  const addPair = (a: number, b: number, op: string) => {
    let result: number
    let expr: string
    switch (op) {
      case "+":
        result = a + b
        expr = `${a} + ${b}`
        break
      case "-":
        result = a - b
        expr = `${a} - ${b}`
        break
      case "x":
        result = a * b
        expr = `${a} x ${b}`
        break
      default:
        result = 0
        expr = ""
    }
    pairs.push({ expression: expr, result: String(result) })
  }

  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

  if (difficulty === "easy") {
    for (let i = 0; i < 4; i++) {
      addPair(rand(1, 5), rand(1, 5), "+")
    }
    for (let i = 0; i < 4; i++) {
      const a = rand(3, 9)
      const b = rand(1, a - 1)
      addPair(a, b, "-")
    }
  } else if (difficulty === "medium") {
    for (let i = 0; i < 4; i++) {
      addPair(rand(5, 15), rand(1, 10), "+")
    }
    for (let i = 0; i < 4; i++) {
      const a = rand(8, 20)
      const b = rand(1, a - 1)
      addPair(a, b, "-")
    }
  } else {
    for (let i = 0; i < 4; i++) {
      addPair(rand(5, 20), rand(2, 9), "x")
    }
    for (let i = 0; i < 4; i++) {
      const a = rand(10, 30)
      const b = rand(1, a - 1)
      addPair(a, b, "-")
    }
  }

  return pairs.sort(() => Math.random() - 0.5)
}

export function generateQuizQuestions(count: number): { prompt: string; options: string[]; correctIndex: number }[] {
  const questions: { prompt: string; options: string[]; correctIndex: number }[] = []

  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

  const ops = [
    { op: "+", fn: (a: number, b: number) => a + b },
    { op: "-", fn: (a: number, b: number) => a - b },
    { op: "x", fn: (a: number, b: number) => a * b },
  ]

  for (let i = 0; i < count; i++) {
    const op = ops[rand(0, 2)]
    let a: number
    let b: number

    if (op.op === "+") {
      a = rand(5, 25)
      b = rand(1, 15)
    } else if (op.op === "-") {
      a = rand(10, 30)
      b = rand(1, a - 1)
    } else {
      a = rand(2, 9)
      b = rand(2, 9)
    }

    const correct = op.fn(a, b)
    const prompt = `${a} ${op.op} ${b} = ?`

    const wrongAnswers = new Set<number>()
    wrongAnswers.add(correct)
    while (wrongAnswers.size < 4) {
      const offset = rand(1, 5)
      const variant = rand(0, 1) === 0 ? correct + offset : correct - offset
      if (variant >= 0) wrongAnswers.add(variant)
    }

    const options = Array.from(wrongAnswers).sort(() => Math.random() - 0.5).map(String)
    const correctIndex = options.indexOf(String(correct))

    questions.push({ prompt, options, correctIndex })
  }

  return questions
}
