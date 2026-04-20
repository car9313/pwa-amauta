import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/features/auth/domain/types";
export type { UserRole } from "@/features/auth/domain/types";

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  hasHydrated: boolean;
  selectedStudentId: string | null;

  // Estado para controlar la verificación inicial del token
  isVerifying: boolean;
  setVerifying: (value: boolean) => void;

  setAuthenticated: (value: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
  selectStudent: (studentId: string) => boolean;
  clearSelectedStudent: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      hasHydrated: false,
      selectedStudentId: null,

      // Inicialmente estamos verificando para mostrar el loader
      isVerifying: true,
      setVerifying: (value) => set({ isVerifying: value }),

      setAuthenticated: (value) => set({ isAuthenticated: value }),

      setUser: (user) => {
        set({
          user,
          isAuthenticated: user !== null,
          selectedStudentId: null,
        });
      },

      clearSession: () =>
        set({
          isAuthenticated: false,
          user: null,
          selectedStudentId: null,
        }),

      setHydrated: (value) => set({ hasHydrated: value }),

      selectStudent: (studentId: string) => {
        const user = get().user;

        if (user?.role === "student") {
          return false;
        }

        if (user?.role === "parent") {
          const childIds = user.children.map((c) => c.studentId);
          if (!childIds.includes(studentId)) {
            return false;
          }
          set({ selectedStudentId: studentId });
          return true;
        }

        return false;
      },

      clearSelectedStudent: () => set({ selectedStudentId: null }),
    }),
    {
      name: "amauta-auth",
      partialize: (state) => ({
        // Solo persistimos lo necesario para restaurar la sesión
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        selectedStudentId: state.selectedStudentId,
        // isVerifying NO se persiste, se reinicia a true en cada carga
      }),
      onRehydrateStorage: () => (state) => {
        // Cuando termina la hidratación, marcamos hasHydrated = true
        state?.setHydrated(true);
      },
    }
  )
);

// Selectores para facilitar el acceso a partes del estado
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectSelectedStudentId = (state: AuthState) => state.selectedStudentId;
export const selectIsParent = (state: AuthState) => state.user?.role === "parent";
export const selectIsStudent = (state: AuthState) => state.user?.role === "student";
export const selectIsTeacher = (state: AuthState) => state.user?.role === "teacher";
export const selectUserRole = (state: AuthState) => state.user?.role ?? null;
export const selectTenantId = (state: AuthState) => state.user?.tenantId ?? null;
export const selectChildren = (state: AuthState) =>
  state.user?.role === "parent" ? state.user.children : [];
export const selectStudentId = (state: AuthState): string | null => {
  if (state.user?.role === "student") {
    return "studentId" in state.user ? state.user.studentId : null;
  }
  if (state.user?.role === "parent" && state.selectedStudentId) {
    const childIds = state.user.children.map((c) => c.studentId);
    if (childIds.includes(state.selectedStudentId)) {
      return state.selectedStudentId;
    }
  }
  return null;
};