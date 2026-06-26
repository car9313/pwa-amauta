import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Trophy } from "lucide-react"
import { AmautaStatCard } from "./amauta-stat-card"

describe("AmautaStatCard", () => {
  it("renders value and label", () => {
    render(<AmautaStatCard value={42} label="Puntos" />)
    expect(screen.getByText("42")).toBeInTheDocument()
    expect(screen.getByText("Puntos")).toBeInTheDocument()
  })

  it("renders string value", () => {
    render(<AmautaStatCard value="Nivel 5" label="Nivel" />)
    expect(screen.getByText("Nivel 5")).toBeInTheDocument()
  })

  it("renders icon when provided", () => {
    render(<AmautaStatCard icon={Trophy} value={100} label="Trofeos" />)
    expect(screen.getByText("100")).toBeInTheDocument()
  })

  it("applies primary color by default", () => {
    render(<AmautaStatCard value={1} label="Primary" />)
    const valueEl = screen.getByText("1")
    expect(valueEl.className).toContain("text-[var(--amauta-blue)]")
  })

  it("applies accent color", () => {
    render(<AmautaStatCard value={2} label="Accent" color="accent" />)
    const valueEl = screen.getByText("2")
    expect(valueEl.className).toContain("text-[var(--amauta-orange-dark)]")
  })

  it("applies success color", () => {
    render(<AmautaStatCard value={3} label="Success" color="success" />)
    const valueEl = screen.getByText("3")
    expect(valueEl.className).toContain("text-success")
  })

  it("applies warning color", () => {
    render(<AmautaStatCard value={4} label="Warning" color="warning" />)
    const valueEl = screen.getByText("4")
    expect(valueEl.className).toContain("text-warning")
  })

  it("applies info color", () => {
    render(<AmautaStatCard value={5} label="Info" color="info" />)
    const valueEl = screen.getByText("5")
    expect(valueEl.className).toContain("text-[var(--amauta-blue)]")
  })

  it("renders up trend indicator", () => {
    render(<AmautaStatCard value={10} label="Stats" trend="up" trendValue="+5%" />)
    expect(screen.getByText("+5%")).toBeInTheDocument()
    expect(screen.getByText("↑")).toBeInTheDocument()
  })

  it("renders down trend indicator", () => {
    render(<AmautaStatCard value={10} label="Stats" trend="down" trendValue="-3%" />)
    expect(screen.getByText("-3%")).toBeInTheDocument()
    expect(screen.getByText("↓")).toBeInTheDocument()
  })

  it("renders neutral trend indicator", () => {
    render(<AmautaStatCard value={10} label="Stats" trend="neutral" trendValue="0%" />)
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("does not render trend section when trendValue not provided", () => {
    render(<AmautaStatCard value={10} label="Stats" trend="up" />)
    expect(screen.queryByText("↑")).not.toBeInTheDocument()
  })

  it("does not render trend section when trend not provided", () => {
    render(<AmautaStatCard value={10} label="Stats" trendValue="+5%" />)
    expect(screen.queryByText("+5%")).not.toBeInTheDocument()
  })

  it("merges custom className", () => {
    render(<AmautaStatCard value={1} label="Custom" className="custom-class" />)
    const el = screen.getByText("1").closest(".group")
    expect(el?.className).toContain("custom-class")
  })
})
