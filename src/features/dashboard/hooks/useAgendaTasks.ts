import { useLiveQuery } from "dexie-react-hooks";
import {
  addAgendaTask,
  deleteAgendaTask,
  getAgendaTasksByStudent,
  setAgendaTaskCompletion,
} from "@/lib/api/storage/agenda-tasks";
import { useStudentDashboard } from "@/hooks/useStudent";
import type { AgendaTask } from "@/features/exercises/domain/exercise.types";

export interface AgendaTaskInput {
  title: string;
  subject: string;
  scheduledAt?: string;
  durationMinutes?: number;
  assignedBy?: string;
  xp?: number;
}

const DEFAULT_DURATION_MINUTES = 15;
const DEFAULT_XP = 10;

export function useAgendaTasks(studentId: string) {
  const dashboardQuery = useStudentDashboard(studentId);

  const localTasks = useLiveQuery(
    () => getAgendaTasksByStudent(studentId),
    [studentId],
    [] as AgendaTask[]
  );

  const addTask = (input: AgendaTaskInput) =>
    addAgendaTask({
      studentId,
      title: input.title,
      subject: input.subject,
      scheduledAt: input.scheduledAt ?? new Date().toISOString(),
      durationMinutes: input.durationMinutes ?? DEFAULT_DURATION_MINUTES,
      assignedBy: input.assignedBy,
      xp: input.xp ?? DEFAULT_XP,
    });

  const toggleTask = (task: AgendaTask) =>
    setAgendaTaskCompletion(task.id, !task.completed);

  const removeTask = (id: string) => deleteAgendaTask(id);

  return {
    student: dashboardQuery.data?.student,
    serverAgenda: dashboardQuery.data?.agenda ?? [],
    progress: dashboardQuery.data?.progress ?? [],
    recentAchievements: dashboardQuery.data?.recentAchievements ?? [],
    localTasks,
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
    addTask,
    toggleTask,
    removeTask,
  };;
}
