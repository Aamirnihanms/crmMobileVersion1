import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type ThemeType = 'light' | 'dark' | 'system';

type ThemeState = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  loadTheme: () => Promise<void>;
};

const THEME_STORAGE_KEY = 'app_theme';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  setTheme: async (theme) => {
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
    set({ theme });
  },
  loadTheme: async () => {
    try {
      const storedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        set({ theme: storedTheme });
      }
    } catch (e) {
      console.error('Error loading theme:', e);
    }
  },
}));
