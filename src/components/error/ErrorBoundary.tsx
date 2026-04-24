import { Component, type ReactNode, type ErrorInfo } from "react";
import { logError } from "./errorLogger";
import {
  StudentFallback,
  ParentFallback,
  GenericFallback,
} from "./FallbackUI";

export type FallbackType = "student" | "parent" | "generic";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackType?: FallbackType;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableLogging?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.enableLogging !== false) {
      const stack = errorInfo.componentStack ?? undefined;
      logError(error, { componentStack: stack });
    }
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { fallbackType = "generic" } = this.props;

      const FallbackComponent =
        fallbackType === "student"
          ? StudentFallback
          : fallbackType === "parent"
          ? ParentFallback
          : GenericFallback;

      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export { StudentFallback, ParentFallback, GenericFallback } from "./FallbackUI";
export type { FallbackProps } from "./FallbackUI";