import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Trophy } from "lucide-react"
import { AmautaReveal } from "./amauta-reveal"

describe("AmautaReveal", () => {
  it("renders content when open={true}", () => {
    render(<AmautaReveal open={true} onClose={vi.fn()} title="Logro desbloqueado" />)
    expect(screen.getByText("Logro desbloqueado")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <AmautaReveal
        open={true}
        onClose={vi.fn()}
        title="Logro"
        description="Has completado la lección"
      />
    )
    expect(screen.getByText("Has completado la lección")).toBeInTheDocument()
  })

  it("renders close button with sr-only text", () => {
    render(<AmautaReveal open={true} onClose={vi.fn()} title="Logro" />)
    expect(screen.getByText("Cerrar")).toBeInTheDocument()
  })

  it("renders Sparkles icon by default", () => {
    render(<AmautaReveal open={true} onClose={vi.fn()} title="Logro" />)
    const sparkles = document.querySelectorAll(".lucide-sparkles")
    expect(sparkles.length).toBeGreaterThanOrEqual(1)
  })

  it("renders custom icon when provided", () => {
    render(
      <AmautaReveal
        open={true}
        onClose={vi.fn()}
        title="Logro"
        icon={<Trophy className="h-10 w-10" />}
      />
    )
    expect(document.querySelector(".lucide-trophy")).toBeInTheDocument()
  })

  it("renders children when provided", () => {
    render(
      <AmautaReveal open={true} onClose={vi.fn()} title="Logro">
        <span>Child content</span>
      </AmautaReveal>
    )
    expect(screen.getByText("Child content")).toBeInTheDocument()
  })

  it("renders action when provided", () => {
    render(
      <AmautaReveal
        open={true}
        onClose={vi.fn()}
        title="Logro"
        action={<button>Continuar</button>}
      />
    )
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument()
  })

  it("does not render children when not provided", () => {
    render(<AmautaReveal open={true} onClose={vi.fn()} title="Logro" />)
    expect(screen.queryByText("Child content")).not.toBeInTheDocument()
  })

  it("does not render action when not provided", () => {
    render(<AmautaReveal open={true} onClose={vi.fn()} title="Logro" />)
    expect(screen.queryByRole("button")).toBeInTheDocument()
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBe(1)
  })
})
