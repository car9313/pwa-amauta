import { db } from "./db";
import type { AgendaTask } from "@/features/exercises/domain/exercise.types";

export type AgendaTaskInput = Omit<
  AgendaTask,
  "id" | "completed" | "completedAt" | "createdAt"
>;

export function generateAgendaTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function getAgendaTasksByStudent(studentId: string): Promise<AgendaTask[]> {
  return db.agendaTasks.where("studentId").equals(studentId).sortBy("createdAt");
}

export async function addAgendaTask(input: AgendaTaskInput): Promise<AgendaTask> {
  const task: AgendaTask = {
    ...input,
    id: generateAgendaTaskId(),
    completed: false,
    completedAt: null,
    createdAt: Date.now(),
  };

  await db.agendaTasks.put(task);
  return task;
}

export async function setAgendaTaskCompletion(id: string, completed: boolean): Promise<void> {
  await db.agendaTasks.update(id, {
    completed,
    completedAt: completed ? Date.now() : null,
  });
}

export async function deleteAgendaTask(id: string): Promise<void> {
  await db.agendaTasks.delete(id);
}

export async function clearAgendaTasks(studentId: string): Promise<void> {
  await db.agendaTasks.where("studentId").equals(studentId).delete();
}
