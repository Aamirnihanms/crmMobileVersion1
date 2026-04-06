import { create } from 'zustand';
import { deleteAuthUser, deleteToken } from '../utils/token';

type AuthUser = {
  uid?: string;
  email?: string;
  full_name?: string;
  phone?: string | null;
  whatsapp_number?: string | null;
  profile_picture?: string | null;
  role?: string;
  role_id?: string;
  is_superuser?: boolean;
  groups_details?: unknown[];
  owned_groups?: unknown[];
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
    await Promise.all([deleteToken(), deleteAuthUser()]);
    set({ isLoggedIn: false, user: null });
  },
}));
