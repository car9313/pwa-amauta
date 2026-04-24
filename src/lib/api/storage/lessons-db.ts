import { db, type Lesson } from "./db";

export { type Lesson } from "./db";

export async function getAllLessons(): Promise<Lesson[]> {
  return db.lessons.toArray();
}

export async function getLessonById(id: string): Promise<Lesson | undefined> {
  return db.lessons.get(id);
}

export async function getLessonsBySubject(subject: string): Promise<Lesson[]> {
  return db.lessons.where("subject").equals(subject).toArray();
}

export async function saveLesson(lesson: Lesson): Promise<void> {
  await db.lessons.put(lesson);
}

export async function saveLessons(lessons: Lesson[]): Promise<void> {
  await db.lessons.bulkPut(lessons);
}

export async function deleteLesson(id: string): Promise<void> {
  await db.lessons.delete(id);
}

export async function clearLessons(): Promise<void> {
  await db.lessons.clear();
}

export async function getLessonsCount(): Promise<number> {
  return db.lessons.count();
}