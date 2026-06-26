import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AmautaDivider } from "./amauta-divider"

describe("AmautaDivider", () => {
  it("renders an hr element when no label or icon", () => {
    const { container } = render(<AmautaDivider />)
    const hr = container.querySelector("hr")
    expect(hr).toBeInTheDocument()
  })

  it("applies border class to plain hr", () => {
    const { container } = render(<AmautaDivider />)
    const hr = container.querySelector("hr")
    expect(hr?.className).toContain("border-t")
    expect(hr?.className).toContain("border-[var(--amauta-blue-light)]")
  })

  it("renders label text inside divider", () => {
    render(<AmautaDivider label="Sección" />)
    expect(screen.getByText("Sección")).toBeInTheDocument()
  })

  it("renders label with two hr elements when label is provided", () => {
    const { container } = render(<AmautaDivider label="Sección" />)
    const hrs = container.querySelectorAll("hr")
    expect(hrs.length).toBe(2)
  })

  it("renders icon when provided", () => {
    render(<AmautaDivider icon={<span>🔹</span>} label="Icon" />)
    expect(screen.getByText("🔹")).toBeInTheDocument()
  })

  it("renders icon without label", () => {
    const { container } = render(<AmautaDivider icon={<span>⭐</span>} />)
    expect(screen.getByText("⭐")).toBeInTheDocument()
    const hrs = container.querySelectorAll("hr")
    expect(hrs.length).toBe(2)
  })

  it("merges custom className", () => {
    const { container } = render(<AmautaDivider className="custom-class" />)
    const hr = container.querySelector("hr")
    expect(hr?.className).toContain("custom-class")
  })
})
