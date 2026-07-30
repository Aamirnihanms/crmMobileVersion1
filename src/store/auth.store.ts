import { create } from 'zustand';
import { deleteAuthUser, deleteToken, deleteRefreshToken, getRefreshToken } from '../utils/token';

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
  token: string | null;
  setLoggedIn: (v: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  logout: (skipApi?: boolean) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  token: null,
  setLoggedIn: (v) => set({ isLoggedIn: v }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: async (skipApi?: boolean) => {
    try {
      if (!skipApi) {
        const refreshToken = await getRefreshToken();
        const { logout: apiLogout } = require('../api/auth.api');
        await apiLogout(refreshToken);
      }
    } catch (err) {
      console.error('Error during API logout:', err);
    } finally {
      try {
        const { deleteFCMToken } = require('../lib/firebaseHelper');
        await deleteFCMToken();
      } catch (fcmErr) {
        console.error('Error deleting FCM token during logout:', fcmErr);
      }
      await Promise.all([deleteToken(), deleteAuthUser(), deleteRefreshToken()]);
      set({ isLoggedIn: false, user: null, token: null });
    }
  },
}));


