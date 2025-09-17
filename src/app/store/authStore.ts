import { create } from "zustand";

interface AuthState {
  isLogin: boolean;
  email: string | null;
  role: string | null;
  login: (email: string, role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLogin: false,
  email: null,
  role: null,
  login: (email: string, role: string) => set({ isLogin: true, email, role }),
  logout: () => set({ isLogin: false, email: null, role: null }),
}));
