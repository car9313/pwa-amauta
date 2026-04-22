import { useEffect, useRef, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { exerciseKeys, lessonKeys, studentKeys } from "@/lib/query/keys";
import { getAllExercises } from "@/lib/api/storage/exercises-db";
import { getAllLessons } from "@/lib/api/storage/lessons-db";
import { getAllStudents } from "@/lib/api/storage/students-db";

interface QueryInitializerState {
  isLoading: boolean;
  hasHydrated: boolean;
}

const store = (() => {
  let state: QueryInitializerState = {
    isLoading: true,
    hasHydrated: false,
  };
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (newState: Partial<QueryInitializerState>) => {
      state = { ...state, ...newState };
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
})();

export function useQueryInitializer() {
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState
  );

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    store.setState({ isLoading: true });

    async function hydrate() {
      try {
        const [exercises, lessons, students] = await Promise.all([
          getAllExercises(),
          getAllLessons(),
          getAllStudents(),
        ]);

        queryClient.setQueryData(exerciseKeys.all, exercises);
        queryClient.setQueryData(lessonKeys.allData(), lessons);
        queryClient.setQueryData(studentKeys.allData(), students);

        store.setState({ isLoading: false, hasHydrated: true });
      } catch (error) {
        console.error("Query hydration failed:", error);
        store.setState({ isLoading: false, hasHydrated: true });
      }
    }

    hydrate();
  }, []);

  return state;
}