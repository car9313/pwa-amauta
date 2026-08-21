export type LessonExerciseStatus = "idle" | "checking" | "correct" | "incorrect";

export type LessonLayoutMode = "sidebar" | "sheet";

export interface LessonSessionSummary {
  xpEarned: number;
  firstTryCorrectCount: number;
  totalAttempts: number;
  topicId: string;
}
