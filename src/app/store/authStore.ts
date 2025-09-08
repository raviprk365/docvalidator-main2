import { create } from "zustand";

interface AuthState {
  isLogin: boolean;
  email: string | null;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLogin: false,
  email: null,
  login: (email: string) => set({ isLogin: true, email }),
  logout: () => set({ isLogin: false, email: null }),
}));
