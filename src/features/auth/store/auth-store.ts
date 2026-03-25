import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "../domain/auth.types";

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  selectedRole: UserRole | null;
  hasHydrated: boolean;

  setAuthenticated: (value: boolean) => void;
  setRole: (role: UserRole | null) => void;
  setSelectedRole: (role: UserRole) => void;
  setHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      selectedRole: null,
      hasHydrated: false,

      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setRole: (role) => set({ role }),
      setSelectedRole: (selectedRole) => set({ selectedRole }),
      setHydrated: (value) => set({ hasHydrated: value }),

      logout: () =>
        set({
          isAuthenticated: false,
          role: null,
          selectedRole: null,
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