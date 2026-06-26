import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AmautaLearningPath } from "./amauta-learning-path"
import type { LearningPathStep } from "./amauta-learning-path"

const mockSteps: LearningPathStep[] = [
  { id: "1", label: "Sumas", description: "Sumas básicas", status: "completed" },
  { id: "2", label: "Restas", description: "Restas básicas", status: "current" },
  { id: "3", label: "Multiplicación", description: "Multiplicación", status: "locked" },
]

describe("AmautaLearningPath", () => {
  it("renders all steps", () => {
    render(<AmautaLearningPath steps={mockSteps} />)
    expect(screen.getByText("Sumas")).toBeInTheDocument()
    expect(screen.getByText("Restas")).toBeInTheDocument()
    expect(screen.getByText("Multiplicación")).toBeInTheDocument()
  })

  it("renders step descriptions in vertical layout", () => {
    render(<AmautaLearningPath steps={mockSteps} />)
    expect(screen.getByText("Sumas básicas")).toBeInTheDocument()
    expect(screen.getByText("Restas básicas")).toBeInTheDocument()
    expect(screen.getByText("Multiplicación")).toBeInTheDocument()
  })

  it("renders vertical layout by default", () => {
    const { container } = render(<AmautaLearningPath steps={mockSteps} />)
    expect(container.querySelector(".flex-col")).toBeInTheDocument()
  })

  it("renders horizontal layout when direction='horizontal'", () => {
    const { container } = render(<AmautaLearningPath steps={mockSteps} direction="horizontal" />)
    expect(container.querySelector(".flex-row")).not.toBeInTheDocument()
    const outer = container.firstElementChild
    expect(outer?.className).toContain("overflow-x-auto")
  })

  it("completed step shows checkmark", () => {
    render(<AmautaLearningPath steps={mockSteps} />)
    const buttons = screen.getAllByRole("button")
    const completedBtn = buttons[0]
    expect(completedBtn.innerHTML).toContain("svg")
  })

  it("current step shows number with pulse", () => {
    render(<AmautaLearningPath steps={mockSteps} />)
    const buttons = screen.getAllByRole("button")
    const currentBtn = buttons[1]
    expect(currentBtn.innerHTML).toContain("animate-pulse")
    expect(currentBtn.innerHTML).toContain("2")
  })

  it("locked step shows lock icon", () => {
    render(<AmautaLearningPath steps={mockSteps} />)
    const buttons = screen.getAllByRole("button")
    const lockedBtn = buttons[2]
    expect(lockedBtn.innerHTML).toContain("svg")
  })

  it("completed step button is not disabled", () => {
    render(<AmautaLearningPath steps={mockSteps} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).not.toBeDisabled()
  })

  it("current step button is not disabled", () => {
    render(<AmautaLearningPath steps={mockSteps} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons[1]).not.toBeDisabled()
  })

  it("locked step button is disabled", () => {
    render(<AmautaLearningPath steps={mockSteps} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons[2]).toBeDisabled()
  })

  it("calls onStepClick when clicking a completed step", async () => {
    const handleClick = vi.fn()
    render(<AmautaLearningPath steps={mockSteps} onStepClick={handleClick} />)
    const user = userEvent.setup()
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[0])
    expect(handleClick).toHaveBeenCalledWith(mockSteps[0])
  })

  it("calls onStepClick when clicking current step", async () => {
    const handleClick = vi.fn()
    render(<AmautaLearningPath steps={mockSteps} onStepClick={handleClick} />)
    const user = userEvent.setup()
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[1])
    expect(handleClick).toHaveBeenCalledWith(mockSteps[1])
  })

  it("does not call onStepClick when clicking locked step", async () => {
    const handleClick = vi.fn()
    render(<AmautaLearningPath steps={mockSteps} onStepClick={handleClick} />)
    const user = userEvent.setup()
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[2])
    expect(handleClick).not.toHaveBeenCalled()
  })

  it("merges custom className", () => {
    const { container } = render(<AmautaLearningPath steps={mockSteps} className="custom-class" />)
    expect(container.firstElementChild?.className).toContain("custom-class")
  })

  it("renders connector lines between steps", () => {
    const { container } = render(<AmautaLearningPath steps={mockSteps} />)
    const connectors = container.querySelectorAll(".flex-1")
    expect(connectors.length).toBeGreaterThanOrEqual(1)
  })
})
