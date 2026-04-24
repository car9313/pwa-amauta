import { db, type StudentProgress } from "./db";

export { type StudentProgress } from "./db";

export async function getProgressByStudent(studentId: string): Promise<StudentProgress[]> {
  return db.progress.where("studentId").equals(studentId).toArray();
}

export async function getProgressByStudentAndLesson(
  studentId: string,
  lessonId: string
): Promise<StudentProgress | undefined> {
  const all = await db.progress.where("studentId").equals(studentId).toArray();
  return all.find(p => p.lessonId === lessonId);
}

export async function saveProgress(progress: StudentProgress): Promise<void> {
  const now = Date.now();
  await db.progress.put({
    ...progress,
    updatedAt: now,
    lastPlayedAt: now,
  });
}

export async function updateProgress(
  studentId: string,
  lessonId: string,
  updates: Partial<StudentProgress>
): Promise<void> {
  const existing = await getProgressByStudentAndLesson(studentId, lessonId);
  
  if (existing) {
    await db.progress.update(existing.id, {
      ...updates,
      updatedAt: Date.now(),
    });
  } else {
    await db.progress.put({
      id: `${studentId}_${lessonId}`,
      studentId,
      lessonId,
      completedExercises: [],
      points: 0,
      level: 1,
      precision: 0,
      streakDays: 0,
      lastPlayedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...updates,
    });
  }
}

export async function deleteProgress(studentId: string, lessonId: string): Promise<void> {
  const existing = await getProgressByStudentAndLesson(studentId, lessonId);
  if (existing) {
    await db.progress.delete(existing.id);
  }
}

export async function clearProgress(): Promise<void> {
  await db.progress.clear();
}

export async function getProgressCount(): Promise<number> {
  return db.progress.count();
}
