import { db, type ConfidenceStage, type ConceptMasteryEntry } from "./db";

export { type ConceptMasteryEntry, type ConfidenceStage } from "./db";

const MIN_MASTERY = 10;
const MAX_MASTERY = 100;
const MASTERED_THRESHOLD = 80;
const PRACTICING_THRESHOLD = 40;
const MAX_CONSECUTIVE_BONUS = 25;

export function buildConceptMasteryId(studentId: string, topicId: string): string {
  return `${studentId}_${topicId}`;
}

export const computeMasteryLevel = (
  accuracyRate: number,
  consecutiveCorrect: number
): number => {
  const consecutiveBonus = Math.min(MAX_CONSECUTIVE_BONUS, consecutiveCorrect * 5);
  return Math.min(
    MAX_MASTERY,
    Math.max(MIN_MASTERY, Math.round(accuracyRate * 0.75 + consecutiveBonus))
  );
};

export const resolveConfidenceStage = (
  masteryLevel: number,
  consecutiveCorrect: number
): ConfidenceStage => {
  if (masteryLevel >= MASTERED_THRESHOLD && consecutiveCorrect >= 2) {
    return "mastered";
  }
  if (masteryLevel >= PRACTICING_THRESHOLD) {
    return "practicing";
  }
  return "exploring";
};

export async function getConceptMasteryById(
  id: string
): Promise<ConceptMasteryEntry | undefined> {
  return db.conceptMastery.get(id);
}

export async function getMasteryByStudent(
  studentId: string
): Promise<ConceptMasteryEntry[]> {
  return db.conceptMastery.where("studentId").equals(studentId).toArray();
}

export async function getMasteryByStudentAndTopic(
  studentId: string,
  topicId: string
): Promise<ConceptMasteryEntry | undefined> {
  return db.conceptMastery.get(buildConceptMasteryId(studentId, topicId));
}

export interface ConceptAttemptInput {
  studentId: string;
  topicId: string;
  subject: string;
  isCorrect: boolean;
  isFirstAttempt: boolean;
}

export async function recordConceptAttempt({
  studentId,
  topicId,
  subject,
  isCorrect,
  isFirstAttempt,
}: ConceptAttemptInput): Promise<ConceptMasteryEntry> {
  const id = buildConceptMasteryId(studentId, topicId);
  const existing = await db.conceptMastery.get(id);

  const consecutiveCorrect = isCorrect
    ? (existing?.consecutiveCorrect ?? 0) + 1
    : 0;
  const totalAttempts = (existing?.totalAttempts ?? 0) + 1;
  const totalCorrect = (existing?.totalCorrect ?? 0) + (isCorrect ? 1 : 0);

  const accuracyRate = (totalCorrect / totalAttempts) * 100;
  const masteryLevel = computeMasteryLevel(accuracyRate, consecutiveCorrect);

  const updated: ConceptMasteryEntry = {
    id,
    studentId,
    topicId,
    subject,
    masteryLevel,
    confidenceStage: resolveConfidenceStage(masteryLevel, consecutiveCorrect),
    consecutiveCorrect,
    totalAttempts,
    totalCorrect,
    firstTryCorrectCount:
      (existing?.firstTryCorrectCount ?? 0) + (isCorrect && isFirstAttempt ? 1 : 0),
    lastPracticedAt: Date.now(),
  };

  await db.conceptMastery.put(updated);
  return updated;
}
