import { db, type Exercise } from "./db";

export { type Exercise } from "./db";

export async function getAllExercises(): Promise<Exercise[]> {
  return db.exercises.toArray();
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function getExercisesByType(type: Exercise["type"]): Promise<Exercise[]> {
  return db.exercises.where("type").equals(type).toArray();
}

export async function getExercisesByDifficulty(difficulty: number): Promise<Exercise[]> {
  return db.exercises.where("difficulty").equals(difficulty).toArray();
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  await db.exercises.put(exercise);
}

export async function saveExercises(exercises: Exercise[]): Promise<void> {
  await db.exercises.bulkPut(exercises);
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id);
}

export async function clearExercises(): Promise<void> {
  await db.exercises.clear();
}

export async function getExercisesCount(): Promise<number> {
  return db.exercises.count();
}