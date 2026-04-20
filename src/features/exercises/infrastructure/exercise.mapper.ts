// src/features/exercises/infrastructure/exercise.mapper.ts
// ============================================================
// Mappers: convierten snake_case del API → camelCase de React
// TEMPORALMENTE DESHABILITADO - necesita actualización de tipos
// ============================================================

// Los tipos de frontend cambiaron y este mapper necesita actualización.
// Por ahora retorna los datos sin conversión.

import type {
  Exercise,
  ExerciseResult,
  NextExerciseRequest,
  ParentReport,
  StudentProgress,
  SubmitAnswerPayload,
} from "../domain/exercise.types";

export function mapExercise(raw: unknown): Exercise {
  return raw as Exercise;
}

export function mapExerciseResult(raw: unknown): ExerciseResult {
  return raw as ExerciseResult;
}

export function mapStudentProgress(raw: unknown): StudentProgress {
  return raw as StudentProgress;
}

export function mapParentReport(raw: unknown): ParentReport {
  return raw as ParentReport;
}

export function mapNextExerciseRequest(req: NextExerciseRequest): Record<string, unknown> {
  return req as unknown as Record<string, unknown>;
}

export function mapSubmitAnswerRequest(req: SubmitAnswerPayload): Record<string, unknown> {
  return req as unknown as Record<string, unknown>;
}