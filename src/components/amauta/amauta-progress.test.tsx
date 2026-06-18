import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaProgress } from "./amauta-progress"

describe("AmautaProgress", () => {
  it("renders label based on default variant", () => {
    render(<AmautaProgress value={50} />)
    expect(screen.getByText("Progreso")).toBeInTheDocument()
  })

  it("renders label based on lesson variant", () => {
    render(<AmautaProgress value={50} amautaVariant="lesson" />)
    expect(screen.getByText("Progreso de lección")).toBeInTheDocument()
  })

  it("renders label based on xp variant", () => {
    render(<AmautaProgress value={50} amautaVariant="xp" />)
    expect(screen.getByText("Puntos de experiencia")).toBeInTheDocument()
  })

  it("renders label based on level variant", () => {
    render(<AmautaProgress value={50} amautaVariant="level" />)
    expect(screen.getByText("Nivel")).toBeInTheDocument()
  })

  it("renders custom label when provided", () => {
    render(<AmautaProgress value={50} label="Mi progreso" />)
    expect(screen.getByText("Mi progreso")).toBeInTheDocument()
  })

  it("shows percentage value by default", () => {
    render(<AmautaProgress value={75} />)
    expect(screen.getByText("75%")).toBeInTheDocument()
  })

  it("hides percentage value when showValue is false", () => {
    render(<AmautaProgress value={75} showValue={false} />)
    expect(screen.queryByText("75%")).not.toBeInTheDocument()
  })

  it("rounds value to nearest integer", () => {
    render(<AmautaProgress value={75.6} />)
    expect(screen.getByText("76%")).toBeInTheDocument()
  })

  it("renders only ProgressBar when hideLabel is true", () => {
    const { container } = render(<AmautaProgress value={60} hideLabel />)
    expect(screen.queryByText("Progreso")).not.toBeInTheDocument()
    expect(screen.queryByText("60%")).not.toBeInTheDocument()
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
  })

  it("passes correct color for lesson variant to ProgressBar", () => {
    render(<AmautaProgress value={50} amautaVariant="lesson" hideLabel />)
    const bar = screen.getByRole("progressbar")
    expect(bar.querySelector(".bg-primary")).toBeInTheDocument()
  })

  it("passes correct color for xp variant to ProgressBar", () => {
    render(<AmautaProgress value={50} amautaVariant="xp" hideLabel />)
    const bar = screen.getByRole("progressbar")
    expect(bar.querySelector(".bg-accent")).toBeInTheDocument()
  })

  it("passes correct color for level variant to ProgressBar", () => {
    render(<AmautaProgress value={50} amautaVariant="level" hideLabel />)
    const bar = screen.getByRole("progressbar")
    expect(bar.querySelector(".bg-success")).toBeInTheDocument()
  })

  it("sets progressbar width based on value", () => {
    render(<AmautaProgress value={42} hideLabel />)
    const fill = screen.getByRole("progressbar").querySelector(".h-full") as HTMLElement
    expect(fill.style.width).toBe("42%")
  })

  it("clamps value between 0 and 100", () => {
    render(<AmautaProgress value={150} hideLabel />)
    const fill = screen.getByRole("progressbar").querySelector(".h-full") as HTMLElement
    expect(fill.style.width).toBe("100%")
  })
})
