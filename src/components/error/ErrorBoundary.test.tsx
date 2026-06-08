import { type ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";
import { logError } from "./errorLogger";

vi.mock("./errorLogger", () => ({
  logError: vi.fn(),
}));

function ThrowError({ message = "Test error" }: { message?: string }): ReactNode {
  throw new Error(message);
}

function ThrowNetworkError(): ReactNode {
  throw new Error("Network request failed: timeout");
}

function SafeComponent() {
  return <div>Safe content</div>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ErrorBoundary", () => {
  describe("without error", () => {
    it("renders children when no error", () => {
      render(
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Safe content")).toBeInTheDocument();
    });
  });

  describe("with error", () => {
    it("renders GenericFallback by default", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
      expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    it("renders StudentFallback when fallbackType is student", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary fallbackType="student">
          <ThrowError />
        </ErrorBoundary>,
      );
      expect(screen.getByText("¡Ups! Algo se atravesó")).toBeInTheDocument();
      expect(screen.getByText("¡Intentar de nuevo!")).toBeInTheDocument();
    });

    it("renders ParentFallback when fallbackType is parent", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary fallbackType="parent">
          <ThrowError />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Error inesperado")).toBeInTheDocument();
      expect(screen.getByText("Reintentar")).toBeInTheDocument();
    });

    it("renders custom fallback when fallback prop is provided", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    });
  });

  describe("network error detection", () => {
    it("shows network error title in GenericFallback", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary>
          <ThrowNetworkError />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Error de conexión")).toBeInTheDocument();
      expect(screen.getByText("Reintentar conexión")).toBeInTheDocument();
    });

    it("shows network error title in StudentFallback", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary fallbackType="student">
          <ThrowNetworkError />
        </ErrorBoundary>,
      );
      expect(screen.getByText("¡Ups! No hay internet")).toBeInTheDocument();
      expect(screen.getByText("¡Verificar de nuevo!")).toBeInTheDocument();
    });

    it("shows network error title in ParentFallback", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary fallbackType="parent">
          <ThrowNetworkError />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Error de conexión")).toBeInTheDocument();
      expect(screen.getByText("Reintentar conexión")).toBeInTheDocument();
    });

    it("hides home button for network errors in GenericFallback", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary>
          <ThrowNetworkError />
        </ErrorBoundary>,
      );
      expect(screen.queryByText("Ir al inicio")).not.toBeInTheDocument();
    });

    it("shows home button for non-network errors in GenericFallback", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Ir al inicio")).toBeInTheDocument();
    });
  });

  describe("resetError", () => {
    it("resets state and re-throws when retry button is clicked", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /intentar de nuevo/i }));
      expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
    });
  });

  describe("onError callback", () => {
    it("calls onError when error is caught", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const onError = vi.fn();
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>,
      );
      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ componentStack: expect.any(String) }));
    });
  });

  describe("logging", () => {
    it("logs error by default", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );
      expect(logError).toHaveBeenCalledOnce();
    });

    it("does not log when enableLogging is false", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <ErrorBoundary enableLogging={false}>
          <ThrowError />
        </ErrorBoundary>,
      );
      expect(logError).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles error without message", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      function ThrowErrorNoMessage(): ReactNode {
        throw new Error();
      }
      render(
        <ErrorBoundary>
          <ThrowErrorNoMessage />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
      expect(screen.getByText("Intentar de nuevo")).toBeInTheDocument();
    });
  });
});
