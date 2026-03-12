// stores/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number; // ahora es número, coincide con Dexie
  email: string;
  name: string;
}

interface AppState {
  user: User | null;
  currentProfileId: number | null;
  
  // Acciones
  login: (user: User) => void;
  logout: () => void;
  setCurrentProfileId: (profileId: number | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      currentProfileId: null,

      login: (user) => set({ user }),
      logout: () => set({ user: null, currentProfileId: null }),
      setCurrentProfileId: (profileId) => set({ currentProfileId: profileId }),
    }),
    {
      name: 'amauta-session-storage',
      // Solo persistimos user y currentProfileId (que son pequeños)
    }
  )
);