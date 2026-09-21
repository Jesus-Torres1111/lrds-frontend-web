import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: Omit<AuthResponse, 'token'> | null;
  sedeSeleccionadaId: number | null; 
  setAuth: (data: AuthResponse) => void;
  setSedeSeleccionadaId: (id: number | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean; 
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({ 
      token: null,
      user: null,
      sedeSeleccionadaId: null,
      setAuth: (data) => {
        const { token, ...user } = data;
        set({ token, user });
      },
      setSedeSeleccionadaId: (id) => set({ sedeSeleccionadaId: id }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
    }
  )
);