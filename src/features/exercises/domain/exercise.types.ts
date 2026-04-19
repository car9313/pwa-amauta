import { z } from "zod";

export const exerciseTypeSchema = z.enum([
  "VISUAL_ADDITION",
  "VISUAL_SUBTRACTION",
  "VISUAL_MULTIPLICATION",
  "VISUAL_DIVISION",
  "TEXT_PROBLEM",
  "INTERACTIVE",
]);

export type ExerciseType = z.infer<typeof exerciseTypeSchema>;

export const answerTypeSchema = z.enum(["NUMERIC", "TEXT", "SELECT", "MULTIPLE_CHOICE"]);

export type AnswerType = z.infer<typeof answerTypeSchema>;

export const difficultyLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export type DifficultyLevel = z.infer<typeof difficultyLevelSchema>;

export const feedbackStyleSchema = z.enum(["ENCOURAGING", "NEUTRAL", "CORRECTIVE"]);

export type FeedbackStyle = z.infer<typeof feedbackStyleSchema>;

export const nextActionSchema = z.enum(["REINFORCE", "ADVANCE", "REMEDIATE"]);

export type NextAction = z.infer<typeof nextActionSchema>;

export const pedagogyTypeSchema = z.enum(["VISUAL", "TEXT", "INTERACTIVE"]);

export type PedagogyType = z.infer<typeof pedagogyTypeSchema>;

export const mistakeTypeSchema = z.enum([
  "CARRY_MISSED",
  "COLUMN_MISALIGN",
  "SIGN_ERROR",
  "CALCULATION_ERROR",
]);

export type MistakeType = z.infer<typeof mistakeTypeSchema>;

export const deviceTypeSchema = z.enum(["mobile", "tablet", "desktop"]);

export type DeviceType = z.infer<typeof deviceTypeSchema>;

export function difficultyToStars(d: DifficultyLevel): number {
  if (d === "LOW") return 2;
  if (d === "MEDIUM") return 3;
  return 5;
}

export const clientContextSchema = z.object({
  deviceType: deviceTypeSchema,
  appVersion: z.string(),
});

export const nextExerciseRequestSchema = z.object({
  studentId: z.string(),
  sessionId: z.string(),
  subject: z.string(),
  topicHint: z.string().optional(),
  locale: z.string(),
  clientContext: clientContextSchema,
});

export type NextExerciseRequest = z.infer<typeof nextExerciseRequestSchema>;

export const exerciseSchema = z.object({
  exerciseId: z.string(),
  type: exerciseTypeSchema,
  topicId: z.string(),
  prompt: z.string(),
  answerType: answerTypeSchema,
  difficulty: difficultyLevelSchema,
  hints: z.array(z.string()),
  feedbackStyle: feedbackStyleSchema,
  stepCurrent: z.number().int().optional(),
  stepTotal: z.number().int().optional(),
  demoContent: z.string().optional(),
  secondaryQuestion: z.string().optional(),
  subInstruction: z.string().optional(),
});

export type Exercise = z.infer<typeof exerciseSchema>;

export const telemetrySchema = z.object({
  responseTimeMs: z.number(),
  hintsUsed: z.number().int(),
  abandoned: z.boolean(),
});

export const submitAnswerRequestSchema = z.object({
  studentId: z.string(),
  exerciseId: z.string(),
  answer: z.string(),
  telemetry: telemetrySchema,
});

export type SubmitAnswerRequest = z.infer<typeof submitAnswerRequestSchema>;

export const submitAnswerPayloadSchema = z.object({
  exerciseId: z.string(),
  answer: z.string(),
});

export type SubmitAnswerPayload = z.infer<typeof submitAnswerPayloadSchema>;

export const mistakeSchema = z.object({
  type: mistakeTypeSchema,
  severity: z.number().min(0).max(1),
});

export type Mistake = z.infer<typeof mistakeSchema>;

export const nextActionDetailSchema = z.object({
  action: nextActionSchema,
  topicId: z.string(),
  pedagogy: pedagogyTypeSchema,
});

export type NextActionDetail = z.infer<typeof nextActionDetailSchema>;

export const exerciseResultSchema = z.object({
  attemptId: z.string(),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  mistakes: z.array(mistakeSchema),
  feedbackSummary: z.string(),
  nextAction: nextActionDetailSchema,
});

export type ExerciseResult = z.infer<typeof exerciseResultSchema>;

export const subjectProgressSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string(),
  mastery: z.number().min(0).max(100),
  lastPractice: z.string(),
});

export type SubjectProgress = z.infer<typeof subjectProgressSchema>;

export const progressAchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  earnedAt: z.string(),
});

export type ProgressAchievement = z.infer<typeof progressAchievementSchema>;

export const weakAreaSchema = z.object({
  topicId: z.string(),
  topicName: z.string(),
  recommendation: z.string(),
});

export type WeakArea = z.infer<typeof weakAreaSchema>;

export const studentProgressSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  overallProgress: z.number().min(0).max(100),
  subjects: z.array(subjectProgressSchema),
  achievements: z.array(progressAchievementSchema),
  weakAreas: z.array(weakAreaSchema),
});

export type StudentProgress = z.infer<typeof studentProgressSchema>;

export const parentReportSchema = z.object({
  studentId: z.string(),
  weekRange: z.string(),
  summary: z.string(),
  highlights: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export type ParentReport = z.infer<typeof parentReportSchema>;

export const studentSummarySchema = z.object({
  studentId: z.string(),
  mastery: z.number().min(0).max(100),
  riskFlags: z.array(z.string()),
});

export type StudentSummary = z.infer<typeof studentSummarySchema>;

export const teacherReportSchema = z.object({
  classId: z.string(),
  studentSummaries: z.array(studentSummarySchema),
});

export type TeacherReport = z.infer<typeof teacherReportSchema>;

export const childProfileSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  level: z.number().int().positive(),
  points: z.number().int().nonnegative(),
  precision: z.number().min(0).max(100),
  streakDays: z.number().int().nonnegative(),
});

export type ChildProfile = z.infer<typeof childProfileSchema>;

export const studentSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  level: z.number().int().positive(),
  points: z.number().int().nonnegative(),
  precision: z.number().min(0).max(100),
  streakDays: z.number().int().nonnegative(),
  streakWeek: z.array(z.boolean()),
});

export type Student = z.infer<typeof studentSchema>;

export const agendaItemSchema = z.object({
  lessonId: z.string(),
  title: z.string(),
  subject: z.string(),
  scheduledAt: z.string(),
  durationMinutes: z.number().int().positive(),
  completed: z.boolean(),
  topicHint: z.string().optional(),
});

export type AgendaItem = z.infer<typeof agendaItemSchema>;

export const progressItemSchema = z.object({
  topicId: z.string(),
  title: z.string(),
  mastery: z.number().min(0).max(100),
});

export type ProgressItem = z.infer<typeof progressItemSchema>;

export const achievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["streak", "level", "accuracy"]),
});

export type Achievement = z.infer<typeof achievementSchema>;

export const studentDashboardSchema = z.object({
  student: studentSchema,
  agenda: z.array(agendaItemSchema),
  progress: z.array(progressItemSchema),
  recentAchievements: z.array(achievementSchema),
});

export type StudentDashboard = z.infer<typeof studentDashboardSchema>;

export const activityItemSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  childName: z.string(),
  action: z.string(),
  subject: z.string(),
  timestamp: z.string(),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;

export const parentProfileSchema = z.object({
  parentId: z.string(),
  name: z.string(),
  email: z.string(),
  children: z.array(childProfileSchema),
});

export type ParentProfile = z.infer<typeof parentProfileSchema>;

export const parentDashboardSchema = z.object({
  parent: parentProfileSchema,
  childrenOverview: z.array(childProfileSchema),
  recentActivity: z.array(activityItemSchema),
});

export type ParentDashboard = z.infer<typeof parentDashboardSchema>;

export interface ExerciseApiResponse {
  exercise: Exercise;
  sessionId: string;
}

export interface SubmitResponse {
  result: ExerciseResult;
}