import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Trophy } from "lucide-react"
import { AmautaAchievement } from "./amauta-achievement"

describe("AmautaAchievement", () => {
  it("renders as a button element", () => {
    render(<AmautaAchievement title="Logro" />)
    const btn = screen.getByRole("button")
    expect(btn.tagName).toBe("BUTTON")
  })

  it("renders title", () => {
    render(<AmautaAchievement title="Primer logro" />)
    expect(screen.getByText("Primer logro")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<AmautaAchievement title="Logro" description="Descripción" />)
    expect(screen.getByText("Descripción")).toBeInTheDocument()
  })

  it("does not render description when not provided", () => {
    render(<AmautaAchievement title="Logro" />)
    expect(screen.queryByText("Descripción")).not.toBeInTheDocument()
  })

  it("renders unlocked state by default", () => {
    render(<AmautaAchievement title="Logro" />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("cursor-pointer")
    expect(btn.className).not.toContain("opacity-60")
    expect(btn).not.toBeDisabled()
  })

  it("renders locked state when unlocked={false}", () => {
    render(<AmautaAchievement title="Logro" unlocked={false} />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("opacity-60")
    expect(btn.className).toContain("cursor-default")
    expect(btn).toBeDisabled()
  })

  it("renders Sparkles overlay when unlocked", () => {
    render(<AmautaAchievement title="Logro" />)
    const btn = screen.getByRole("button")
    const sparkles = btn.querySelector(".lucide-sparkles")
    expect(sparkles).toBeInTheDocument()
  })

  it("does not render Sparkles overlay when locked", () => {
    render(<AmautaAchievement title="Logro" unlocked={false} />)
    const btn = screen.getByRole("button")
    const sparkles = btn.querySelector(".lucide-sparkles")
    expect(sparkles).not.toBeInTheDocument()
  })

  it("renders default Sparkles icon when no icon prop", () => {
    render(<AmautaAchievement title="Logro" />)
    const btn = screen.getByRole("button")
    const sparkles = btn.querySelectorAll(".lucide-sparkles")
    expect(sparkles.length).toBeGreaterThanOrEqual(2)
  })

  it("renders custom icon when provided", () => {
    render(<AmautaAchievement icon={Trophy} title="Logro" />)
    const btn = screen.getByRole("button")
    expect(btn.querySelector(".lucide-trophy")).toBeInTheDocument()
  })

  it("calls onReveal when clicked on unlocked achievement", async () => {
    const handleReveal = vi.fn()
    render(<AmautaAchievement title="Logro" onReveal={handleReveal} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole("button"))
    expect(handleReveal).toHaveBeenCalledOnce()
  })

  it("applies sm size classes", () => {
    render(<AmautaAchievement title="Sm" size="sm" />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("min-w-[100px]")
    expect(btn.className).toContain("p-3")
  })

  it("applies md size classes", () => {
    render(<AmautaAchievement title="Md" size="md" />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("min-w-[120px]")
  })

  it("applies lg size classes", () => {
    render(<AmautaAchievement title="Lg" size="lg" />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("min-w-[140px]")
    expect(btn.className).toContain("p-5")
  })

  it("merges custom className", () => {
    render(<AmautaAchievement title="Custom" className="custom-class" />)
    expect(screen.getByRole("button").className).toContain("custom-class")
  })
})
