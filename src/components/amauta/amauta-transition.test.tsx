import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaTransition, AmautaTransitionItem } from "./amauta-transition"

describe("AmautaTransition", () => {
  it("renders children", () => {
    render(<AmautaTransition>Content</AmautaTransition>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("applies default fade-in-up animation class", () => {
    render(<AmautaTransition>Animated</AmautaTransition>)
    const el = screen.getByText("Animated")
    expect(el.className).toContain("animate-fade-in-up")
  })

  it("applies scale-in animation class", () => {
    render(<AmautaTransition animation="scale-in">Scale</AmautaTransition>)
    expect(screen.getByText("Scale").className).toContain("animate-scale-in")
  })

  it("applies slide-in-right animation class", () => {
    render(<AmautaTransition animation="slide-in-right">Slide</AmautaTransition>)
    expect(screen.getByText("Slide").className).toContain("animate-slide-in-right")
  })

  it("wraps each child with animation delay when stagger > 0", () => {
    render(
      <AmautaTransition stagger={300}>
        <span>First</span>
        <span>Second</span>
        <span>Third</span>
      </AmautaTransition>
    )
    const first = screen.getByText("First")
    const second = screen.getByText("Second")
    const third = screen.getByText("Third")
    expect(first.style.animationDelay).toBe("0ms")
    expect(second.style.animationDelay).toBe("150ms")
    expect(third.style.animationDelay).toBe("300ms")
  })

  it("applies reverse stagger order", () => {
    render(
      <AmautaTransition stagger={300} order="reverse">
        <span>First</span>
        <span>Second</span>
        <span>Third</span>
      </AmautaTransition>
    )
    const first = screen.getByText("First")
    const third = screen.getByText("Third")
    expect(first.style.animationDelay).toBe("300ms")
    expect(third.style.animationDelay).toBe("0ms")
  })

  it("renders single child without extra wrapper when no stagger", () => {
    const { container } = render(
      <AmautaTransition>
        <span>Single</span>
      </AmautaTransition>
    )
    expect(container.querySelectorAll(".animate-fade-in-up").length).toBe(1)
  })

  it("merges custom className", () => {
    render(<AmautaTransition className="custom-class">Custom</AmautaTransition>)
    expect(screen.getByText("Custom").parentElement?.className).toContain("custom-class")
  })
})

describe("AmautaTransitionItem", () => {
  it("renders children", () => {
    render(<AmautaTransitionItem>Item</AmautaTransitionItem>)
    expect(screen.getByText("Item")).toBeInTheDocument()
  })

  it("applies fade-in-up animation by default", () => {
    render(<AmautaTransitionItem>Default</AmautaTransitionItem>)
    expect(screen.getByText("Default").className).toContain("animate-fade-in-up")
  })

  it("uses animation from prop over context", () => {
    render(
      <AmautaTransition animation="scale-in">
        <AmautaTransitionItem animation="slide-in-right">Item</AmautaTransitionItem>
      </AmautaTransition>
    )
    expect(screen.getByText("Item").className).toContain("animate-slide-in-right")
  })

  it("uses context animation when no prop provided", () => {
    render(
      <AmautaTransition animation="scale-in">
        <AmautaTransitionItem>Item</AmautaTransitionItem>
      </AmautaTransition>
    )
    expect(screen.getByText("Item").className).toContain("animate-scale-in")
  })

  it("applies delay based on index within context", () => {
    render(
      <AmautaTransition stagger={200}>
        <AmautaTransitionItem index={0}>First</AmautaTransitionItem>
        <AmautaTransitionItem index={1}>Second</AmautaTransitionItem>
      </AmautaTransition>
    )
    expect(screen.getByText("First").style.animationDelay).toBe("0ms")
    expect(screen.getByText("Second").style.animationDelay).toBe("100ms")
  })

  it("merges custom className", () => {
    render(<AmautaTransitionItem className="custom-class">Custom</AmautaTransitionItem>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })
})
