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

  it("uses success color with colorByValue at 100 percent", () => {
    render(<AmautaProgress value={100} colorByValue hideLabel />)
    const bar = screen.getByRole("progressbar")
    expect(bar.querySelector(".bg-success")).toBeInTheDocument()
  })

  it("uses primary color with colorByValue at 50 percent or more", () => {
    render(<AmautaProgress value={50} colorByValue hideLabel />)
    const bar = screen.getByRole("progressbar")
    expect(bar.querySelector(".bg-primary")).toBeInTheDocument()
  })

  it("uses accent color with colorByValue below 50 percent", () => {
    render(<AmautaProgress value={49} colorByValue hideLabel />)
    const bar = screen.getByRole("progressbar")
    expect(bar.querySelector(".bg-accent")).toBeInTheDocument()
  })

  it("supports custom max value", () => {
    const { container } = render(<AmautaProgress value={5} max={10} hideLabel />)
    const fill = container.querySelector('[role="progressbar"] .h-full') as HTMLElement
    expect(fill.style.width).toBe("50%")
  })

  it("sets progressbar width based on value", () => {
    const { container } = render(<AmautaProgress value={42} hideLabel />)
    const fill = container.querySelector('[role="progressbar"] .h-full') as HTMLElement
    expect(fill.style.width).toBe("42%")
  })

  it("clamps value between 0 and 100", () => {
    const { container } = render(<AmautaProgress value={150} hideLabel />)
    const fill = container.querySelector('[role="progressbar"] .h-full') as HTMLElement
    expect(fill.style.width).toBe("100%")
  })

  it("shows tip star above 6 percent by default", () => {
    const { container } = render(<AmautaProgress value={50} hideLabel />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar?.querySelector(".lucide-star")).toBeInTheDocument()
  })

  it("hides tip star at or below 6 percent", () => {
    const { container } = render(<AmautaProgress value={3} hideLabel />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar?.querySelector(".lucide-star")).not.toBeInTheDocument()
  })

  it("hides tip star when showTipStar is false", () => {
    const { container } = render(
      <AmautaProgress value={50} hideLabel showTipStar={false} />
    )
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar?.querySelector(".lucide-star")).not.toBeInTheDocument()
  })

  it("applies hover glow by default", () => {
    const { container } = render(<AmautaProgress value={50} hideLabel />)
    const fill = container.querySelector('[role="progressbar"] .h-full')
    expect(fill?.className).toContain("group-hover/progress:shadow")
  })

  it("removes hover glow when interactive is false", () => {
    const { container } = render(
      <AmautaProgress value={50} hideLabel interactive={false} />
    )
    const fill = container.querySelector('[role="progressbar"] .h-full')
    expect(fill?.className).not.toContain("group-hover/progress:shadow")
  })
})
