import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CTAEducational } from "./cta-educational"

describe("CTAEducational", () => {
  it("renders headline", () => {
    render(
      <CTAEducational headline="¡Empieza ya!" buttonLabel="Comenzar" buttonOnClick={vi.fn()} />
    )
    expect(screen.getByText("¡Empieza ya!")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <CTAEducational
        headline="Título"
        description="Descripción de la CTA"
        buttonLabel="Comenzar"
        buttonOnClick={vi.fn()}
      />
    )
    expect(screen.getByText("Descripción de la CTA")).toBeInTheDocument()
  })

  it("renders button with label", () => {
    render(
      <CTAEducational headline="Título" buttonLabel="Comenzar" buttonOnClick={vi.fn()} />
    )
    expect(screen.getByRole("button", { name: "Comenzar" })).toBeInTheDocument()
  })

  it("calls buttonOnClick when button is clicked", async () => {
    const handleClick = vi.fn()
    render(
      <CTAEducational headline="Título" buttonLabel="Click" buttonOnClick={handleClick} />
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button"))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it("applies primary variant by default", () => {
    render(
      <CTAEducational headline="Título" buttonLabel="Btn" buttonOnClick={vi.fn()} />
    )
    const section = screen.getByText("Título").closest("section")
    expect(section?.className).toContain("text-white")
  })

  it("applies accent variant", () => {
    render(
      <CTAEducational
        headline="Título"
        buttonLabel="Btn"
        buttonOnClick={vi.fn()}
        variant="accent"
      />
    )
    const section = screen.getByText("Título").closest("section")
    expect(section?.className).toContain("amauta-orange")
  })

  it("applies dark variant", () => {
    render(
      <CTAEducational
        headline="Título"
        buttonLabel="Btn"
        buttonOnClick={vi.fn()}
        variant="dark"
      />
    )
    const section = screen.getByText("Título").closest("section")
    expect(section?.className).toContain("amauta-blue-dark")
  })

  it("renders noise overlay", () => {
    const { container } = render(
      <CTAEducational headline="Título" buttonLabel="Btn" buttonOnClick={vi.fn()} />
    )
    expect(container.querySelector(".noise-overlay")).toBeInTheDocument()
  })

  it("merges custom className", () => {
    render(
      <CTAEducational
        headline="Título"
        buttonLabel="Btn"
        buttonOnClick={vi.fn()}
        className="custom-class"
      />
    )
    const section = screen.getByText("Título").closest("section")
    expect(section?.className).toContain("custom-class")
  })
})
