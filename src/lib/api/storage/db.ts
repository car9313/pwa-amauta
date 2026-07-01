import Dexie, { type EntityTable } from "dexie";
import type { AuthUser } from "@/features/auth/domain/types";

export interface TokenData {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
}

export interface StoredUser {
  id: string;
  user: AuthUser;
  storedAt: number;
}

export interface UserPreferencesEntry {
  id: "user-preferences";
  selectedStudentId: string | null;
  locale: string | null;
  updatedAt: number;
}

export interface LocaleCacheEntry {
  id: string;
  userId: string;
  localeId: string;
  data: unknown;
  version: string;
  cachedAt: number;
}

 /* export type PreferencesEntry = UserPreferencesEntry | LocaleCacheEntry; 
 */
export interface LastActiveUserEntry {
  id: "last-active-user";
  userId: string;
  updatedAt: number;
}

export type PreferencesEntry = UserPreferencesEntry | LocaleCacheEntry | LastActiveUserEntry;

export interface QueuedMutation {
  id: string;
  type: string;
  payload: unknown;
  endpoint: string;
  method: string;
  priority: number;
  retryCount: number;
  status: string;
  createdAt: number;
  lastAttemptAt: number | null;
  errorMessage: string | null;
  result: unknown | null;
}

export interface Exercise {
  id: string;
  title: string;
  type: "math" | "spanish" | "science" | "logic";
  difficulty: number;
  points: number;
  content: unknown;
  subject: string;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  exerciseIds: string[];
  grade: number;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  lessonId: string;
  completedExercises: string[];
  points: number;
  level: number;
  precision: number;
  streakDays: number;
  lastPlayedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface Student {
  id: string;
  name: string;
  avatar: string | null;
  parentId: string;
  grade: number;
  createdAt: number;
}

export interface AmautaDatabase extends Dexie {
  tokens: EntityTable<TokenData, "id">;
  users: EntityTable<StoredUser, "id">;
  preferences: EntityTable<PreferencesEntry, "id">;
  mutations: EntityTable<QueuedMutation, "id">;
  exercises: EntityTable<Exercise, "id">;
  lessons: EntityTable<Lesson, "id">;
  progress: EntityTable<StudentProgress, "id">;
  students: EntityTable<Student, "id">;
}

export const db = new Dexie("amauta-db") as AmautaDatabase;

db.version(1).stores({
  tokens: "id",
  users: "id",
  preferences: "id",
  mutations: "id, status, priority, createdAt, type",
  exercises: "id, type, difficulty, subject",
  lessons: "id, subject",
  progress: "studentId, lessonId",
  students: "id",
});

db.version(2).stores({
  tokens: "id",
  users: "id",
  preferences: "id",
  mutations: "id, status, priority, createdAt, type",
  exercises: "id, type, difficulty, subject",
  lessons: "id, subject",
  progress: "studentId, lessonId",
  students: "id",
  localeCache: "id",
});

db.version(3).stores({
  tokens: "id",
  users: "id",
  preferences: "id, userId, localeId, cachedAt",
  mutations: "id, status, priority, createdAt, type",
  exercises: "id, type, difficulty, subject",
  lessons: "id, subject",
  progress: "studentId, lessonId",
  students: "id",
}).upgrade(tx => {
  return tx.table("preferences").delete("user-preferences");
});