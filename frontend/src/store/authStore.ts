import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  setAuth: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuth: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'kora-auth-storage',
      partialize: (state) => ({ user: state.user }), // Explicitly save only user
    }
  )
);
