import { useColorScheme } from 'react-native';
import { colorsLight, colorsDark } from './colors';
import { useThemeStore } from '../store/theme.store';

export function useAppTheme() {
  const systemColorScheme = useColorScheme();
  const theme = useThemeStore((state) => state.theme);

  const isDark = theme === 'system'
    ? systemColorScheme === 'dark'
    : theme === 'dark';

  const colors = isDark ? colorsDark : colorsLight;

  return {
    colors,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}
