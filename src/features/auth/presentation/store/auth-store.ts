import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../../domain/auth.types";


export type UserRole = "student" | "parent";

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  selectedRole: UserRole | null;
  user: AuthUser | null;
  hasHydrated: boolean;

  setAuthenticated: (value: boolean) => void;
  setRole: (role: UserRole) => void;
  setSelectedRole: (role: UserRole) => void;
  setUser: (user: AuthUser | null) => void;
  setHydrated: (value: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      selectedRole: null,
      user: null,
      hasHydrated: false,

      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setRole: (role) => set({ role }),
      setSelectedRole: (selectedRole) => set({ selectedRole }),
      setUser: (user) => set({ user }),
      setHydrated: (value) => set({ hasHydrated: value }),

      clearSession: () =>
        set({
          isAuthenticated: false,
          role: null,
          selectedRole: null,
          user: null,
        }),
    }),
    {
      name: "amauta-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);