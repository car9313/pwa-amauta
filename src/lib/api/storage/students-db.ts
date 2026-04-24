import { db, type Student } from "./db";

export { type Student } from "./db";

export async function getAllStudents(): Promise<Student[]> {
  return db.students.toArray();
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  return db.students.get(id);
}

export async function getStudentsByParent(parentId: string): Promise<Student[]> {
  return db.students.where("parentId").equals(parentId).toArray();
}

export async function saveStudent(student: Student): Promise<void> {
  await db.students.put(student);
}

export async function saveStudents(students: Student[]): Promise<void> {
  await db.students.bulkPut(students);
}

export async function deleteStudent(id: string): Promise<void> {
  await db.students.delete(id);
}

export async function clearStudents(): Promise<void> {
  await db.students.clear();
}

export async function getStudentsCount(): Promise<number> {
  return db.students.count();
}