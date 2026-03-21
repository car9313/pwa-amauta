import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "student" | "parent";

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  selectedRole: UserRole | null;

  setAuthenticated: (value: boolean) => void;
  setRole: (role: UserRole) => void;
  setSelectedRole: (role: UserRole) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      selectedRole: null,

      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setRole: (role) => set({ role }),
      setSelectedRole: (selectedRole) => set({ selectedRole }),

      clearSession: () =>
        set({
          isAuthenticated: false,
          role: null,
          selectedRole: null,
        }),
    }),
    {
      name: "amauta-auth",
    }
  )
);