// src/features/auth/utils/create-form-error-handler.ts
import type {
  FieldPath,
  FieldValues,
  UseFormSetError,
} from "react-hook-form";

type CreateFormErrorHandlerParams<T extends FieldValues> = {
  setError: UseFormSetError<T>;
  field: FieldPath<T>;
  fallbackMessage: string;
};

export function createFormErrorHandler<T extends FieldValues>({
  setError,
  field,
  fallbackMessage,
}: CreateFormErrorHandlerParams<T>) {
  return (error: unknown): void => {
    const message =
      error instanceof Error ? error.message : fallbackMessage;

    setError(field, {
      type: "manual",
      message,
    });
  };
}