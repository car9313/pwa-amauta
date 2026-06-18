import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaBadge } from "./amauta-badge"

describe("AmautaBadge", () => {
  it("renders children", () => {
    render(<AmautaBadge>New</AmautaBadge>)
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("renders as a span element", () => {
    render(<AmautaBadge>Tag</AmautaBadge>)
    const el = screen.getByText("Tag")
    expect(el.tagName).toBe("SPAN")
  })

  it("applies default variant classes", () => {
    render(<AmautaBadge>Default</AmautaBadge>)
    const el = screen.getByText("Default")
    expect(el.className).toContain("amauta-blue-light")
  })

  it("accepts variant prop", () => {
    render(<AmautaBadge variant="success">Success</AmautaBadge>)
    const el = screen.getByText("Success")
    expect(el.className).toContain("bg-success")
  })

  it("accepts size prop", () => {
    render(<AmautaBadge size="sm">Small</AmautaBadge>)
    const el = screen.getByText("Small")
    expect(el.className).toContain("px-2")
    expect(el.className).toContain("text-xs")
  })

  it("accepts xp variant", () => {
    render(<AmautaBadge variant="xp">+50 XP</AmautaBadge>)
    const el = screen.getByText("+50 XP")
    expect(el.className).toContain("amauta-orange-light")
  })

  it("accepts streak variant", () => {
    render(<AmautaBadge variant="streak">3 days</AmautaBadge>)
    const el = screen.getByText("3 days")
    expect(el.className).toContain("gradient-to-r")
  })

  it("accepts achievement variant", () => {
    render(<AmautaBadge variant="achievement">Trophy</AmautaBadge>)
    const el = screen.getByText("Trophy")
    expect(el.className).toContain("gradient-to-br")
  })

  it("merges custom className", () => {
    render(<AmautaBadge className="custom-class">Custom</AmautaBadge>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })
})
