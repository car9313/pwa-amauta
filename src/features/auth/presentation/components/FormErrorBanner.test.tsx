import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormErrorBanner } from "./FormErrorBanner";
import type { AuthError, AuthErrorCode } from "../../domain/auth-error";

const buildError = (code: AuthErrorCode, message = "Mensaje de error"): AuthError => ({
  code,
  message,
});

describe("FormErrorBanner", () => {
  it("renders nothing when error is null", () => {
    const { container } = render(<FormErrorBanner error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the error message with role=alert", () => {
    render(<FormErrorBanner error={buildError("NETWORK_ERROR", "Sin internet")} />);
    const banner = screen.getByRole("alert");
    expect(banner).toHaveTextContent("Sin internet");
  });

  it("exposes the error code via data-error-code", () => {
    render(<FormErrorBanner error={buildError("TIMEOUT", "Lento")} />);
    expect(screen.getByTestId("form-error-banner")).toHaveAttribute(
      "data-error-code",
      "TIMEOUT"
    );
  });

  it("does not show a retry button for non-retryable codes", () => {
    render(
      <FormErrorBanner
        error={buildError("TOKEN_INVALID")}
        onRetry={() => {}}
      />
    );
    expect(screen.queryByRole("button", { name: /reintentar/i })).toBeNull();
  });

  it.each(["NETWORK_ERROR", "TIMEOUT", "REFRESH_FAILED"] as const)(
    "shows a retry button for retryable code %s",
    (code) => {
      render(<FormErrorBanner error={buildError(code)} onRetry={() => {}} />);
      expect(
        screen.getByRole("button", { name: /reintentar/i })
      ).toBeInTheDocument();
    }
  );

  it("does not show a retry button when onRetry is not provided", () => {
    render(<FormErrorBanner error={buildError("NETWORK_ERROR")} />);
    expect(screen.queryByRole("button", { name: /reintentar/i })).toBeNull();
  });

  it("invokes onRetry when the retry button is clicked", () => {
    const handleRetry = vi.fn();
    render(
      <FormErrorBanner
        error={buildError("TIMEOUT")}
        onRetry={handleRetry}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(handleRetry).toHaveBeenCalledOnce();
  });

  it("applies warning variant styling when variant=warning", () => {
    render(
      <FormErrorBanner
        error={buildError("NETWORK_ERROR")}
        variant="warning"
      />
    );
    const banner = screen.getByTestId("form-error-banner");
    expect(banner.className).toMatch(/amber/);
  });
});
