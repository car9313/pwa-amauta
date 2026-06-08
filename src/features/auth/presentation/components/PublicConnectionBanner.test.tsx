import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { PublicConnectionBanner } from "./PublicConnectionBanner";

describe("PublicConnectionBanner", () => {
  const setOnline = (value: boolean): void => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => value,
    });
  };

  beforeEach(() => {
    setOnline(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when online", () => {
    const { container } = render(<PublicConnectionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the offline message when navigator is offline", () => {
    setOnline(false);
    render(<PublicConnectionBanner />);
    expect(
      screen.getByText(/no tienes internet/i)
    ).toBeInTheDocument();
  });

  it("toggles visibility when the browser fires online/offline events", () => {
    setOnline(true);
    const { container } = render(<PublicConnectionBanner />);
    expect(container.firstChild).toBeNull();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(
      screen.getByText(/no tienes internet/i)
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(
      screen.queryByText(/no tienes internet/i)
    ).toBeNull();
  });

  it("has role=status and aria-live=polite for accessibility", () => {
    setOnline(false);
    render(<PublicConnectionBanner />);
    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("aria-live", "polite");
  });
});
