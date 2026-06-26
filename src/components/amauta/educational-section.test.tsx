import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { EducationalSection } from "./educational-section"

describe("EducationalSection", () => {
  it("renders title", () => {
    render(<EducationalSection title="Aprende" description="Descripción" />)
    expect(screen.getByText("Aprende")).toBeInTheDocument()
  })

  it("renders description", () => {
    render(<EducationalSection title="Aprende" description="Descripción" />)
    expect(screen.getByText("Descripción")).toBeInTheDocument()
  })

  it("renders icon when provided", () => {
    render(<EducationalSection title="Aprende" description="Desc" icon={<span>🎯</span>} />)
    expect(screen.getByText("🎯")).toBeInTheDocument()
  })

  it("renders image with alt text when provided", () => {
    render(
      <EducationalSection
        title="Aprende"
        description="Desc"
        image="/test.jpg"
        imageAlt="Test image"
      />
    )
    const img = screen.getByAltText("Test image")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "/test.jpg")
  })

  it("does not render image when not provided", () => {
    render(<EducationalSection title="Aprende" description="Desc" />)
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("applies default layout (not reversed)", () => {
    const { container } = render(<EducationalSection title="Aprende" description="Desc" />)
    const innerFlex = container.querySelector(".flex-col")
    expect(innerFlex?.className).toContain("lg:flex-row")
    expect(innerFlex?.className).not.toContain("lg:flex-row-reverse")
  })

  it("applies reversed layout when reversed={true}", () => {
    const { container } = render(
      <EducationalSection title="Aprende" description="Desc" reversed />
    )
    const innerFlex = container.querySelector(".flex-col")
    expect(innerFlex?.className).toContain("lg:flex-row-reverse")
  })

  it("renders action node when provided", () => {
    render(
      <EducationalSection
        title="Aprende"
        description="Desc"
        action={<button>Saber más</button>}
      />
    )
    expect(screen.getByRole("button", { name: "Saber más" })).toBeInTheDocument()
  })

  it("does not render action when not provided", () => {
    render(<EducationalSection title="Aprende" description="Desc" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("applies default variant", () => {
    render(<EducationalSection title="Aprende" description="Desc" />)
    const section = screen.getByText("Aprende").closest("section")
    expect(section?.className).toContain("bg-background")
  })

  it("applies alt variant", () => {
    render(<EducationalSection title="Aprende" description="Desc" variant="alt" />)
    const section = screen.getByText("Aprende").closest("section")
    expect(section?.className).toContain("amauta-surface-alt")
  })

  it("applies primary variant", () => {
    render(<EducationalSection title="Aprende" description="Desc" variant="primary" />)
    const section = screen.getByText("Aprende").closest("section")
    expect(section?.className).toContain("text-white")
  })

  it("applies id prop", () => {
    render(<EducationalSection title="Aprende" description="Desc" id="section-id" />)
    const section = screen.getByText("Aprende").closest("section")
    expect(section?.getAttribute("id")).toBe("section-id")
  })

  it("merges custom className", () => {
    render(
      <EducationalSection title="Aprende" description="Desc" className="custom-class" />
    )
    const section = screen.getByText("Aprende").closest("section")
    expect(section?.className).toContain("custom-class")
  })
})
