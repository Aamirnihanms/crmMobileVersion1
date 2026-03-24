import { create } from 'zustand';
import { deleteToken } from '../utils/token';

type AuthUser = {
  uid?: string;
  email?: string;
  full_name?: string;
  role?: string;
};

type AuthState = {
  isLoggedIn: boolean;
  user: AuthUser | null;
  setLoggedIn: (v: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  setLoggedIn: (v) => set({ isLoggedIn: v }),
  setUser: (user) => set({ user }),
  logout: async () => {
    await deleteToken();
    set({ isLoggedIn: false, user: null });
  },
}));
