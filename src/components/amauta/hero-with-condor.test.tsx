import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HeroWithCondor } from "./hero-with-condor"

describe("HeroWithCondor", () => {
  it("renders headline and subtitle", () => {
    render(
      <HeroWithCondor
        headline="Aprende Matemáticas"
        subtitle="Divertido y fácil"
      />
    )
    expect(screen.getByText("Aprende Matemáticas")).toBeInTheDocument()
    expect(screen.getByText("Divertido y fácil")).toBeInTheDocument()
  })

  it("renders CondorGuide with message", () => {
    render(
      <HeroWithCondor
        headline="Título"
        subtitle="Subtítulo"
        condorMessage="¡Bienvenido!"
      />
    )
    expect(screen.getByText("¡Bienvenido!")).toBeInTheDocument()
    expect(screen.getByAltText("Amauta")).toBeInTheDocument()
  })

  it("does not render CondorGuide when no message", () => {
    render(
      <HeroWithCondor
        headline="Título"
        subtitle="Subtítulo"
      />
    )
    expect(screen.queryByAltText("Amauta")).toBeInTheDocument()
    expect(screen.queryByText("¡Bienvenido!")).not.toBeInTheDocument()
  })

  it("renders primary CTA button with label", () => {
    render(
      <HeroWithCondor
        headline="Título"
        subtitle="Subtítulo"
        primaryCta={{ label: "Comenzar", onClick: vi.fn() }}
      />
    )
    expect(screen.getByRole("button", { name: "Comenzar" })).toBeInTheDocument()
  })

  it("renders secondary CTA button with label", () => {
    render(
      <HeroWithCondor
        headline="Título"
        subtitle="Subtítulo"
        secondaryCta={{ label: "Saber más", onClick: vi.fn() }}
      />
    )
    expect(screen.getByRole("button", { name: "Saber más" })).toBeInTheDocument()
  })

  it("calls primaryCta.onClick when primary button is clicked", async () => {
    const handlePrimary = vi.fn()
    render(
      <HeroWithCondor
        headline="Título"
        subtitle="Subtítulo"
        primaryCta={{ label: "Comenzar", onClick: handlePrimary }}
      />
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button"))
    expect(handlePrimary).toHaveBeenCalledOnce()
  })

  it("calls secondaryCta.onClick when secondary button is clicked", async () => {
    const handleSecondary = vi.fn()
    render(
      <HeroWithCondor
        headline="Título"
        subtitle="Subtítulo"
        secondaryCta={{ label: "Saber más", onClick: handleSecondary }}
      />
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button"))
    expect(handleSecondary).toHaveBeenCalledOnce()
  })

  it("does not render CTAs when not provided", () => {
    render(
      <HeroWithCondor
        headline="Título"
        subtitle="Subtítulo"
      />
    )
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders both CTAs when both provided", () => {
    render(
      <HeroWithCondor
        headline="Título"
        subtitle="Subtítulo"
        primaryCta={{ label: "Comenzar", onClick: vi.fn() }}
        secondaryCta={{ label: "Saber más", onClick: vi.fn() }}
      />
    )
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBe(2)
  })

  it("merges custom className", () => {
    const { container } = render(
      <HeroWithCondor
        headline="Título"
        subtitle="Subtítulo"
        className="custom-class"
      />
    )
    const section = container.querySelector("section")
    expect(section?.className).toContain("custom-class")
  })
})
