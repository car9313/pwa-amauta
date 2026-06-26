import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaButton } from "./amauta-button"

describe("AmautaButton", () => {
  it("renders children", () => {
    render(<AmautaButton>Click me</AmautaButton>)
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("applies default variant classes", () => {
    render(<AmautaButton>Default</AmautaButton>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("rounded-xl")
  })

  it("accepts accent variant", () => {
    render(<AmautaButton amautaVariant="accent">Accent</AmautaButton>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("amauta-orange")
    expect(btn.className).toContain("text-white")
  })

  it("accepts success variant", () => {
    render(<AmautaButton amautaVariant="success">Success</AmautaButton>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("bg-success")
    expect(btn.className).toContain("text-white")
  })

  it("merges custom className", () => {
    render(<AmautaButton className="my-custom-class">Custom</AmautaButton>)
    expect(screen.getByRole("button").className).toContain("my-custom-class")
  })

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn()
    render(<AmautaButton onClick={handleClick}>Click</AmautaButton>)
    screen.getByRole("button").click()
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it("renders as a button element", () => {
    render(<AmautaButton>Btn</AmautaButton>)
    expect(screen.getByRole("button").tagName).toBe("BUTTON")
  })
})
