import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';
import { useAppTheme } from '@/src/theme';

type BarStyle = 'light' | 'dark';

type UseSystemBarsStyleOptions = {
  statusBarStyle?: BarStyle;
};

export default function useSystemBarsStyle({
  statusBarStyle,
}: UseSystemBarsStyleOptions = {}) {
  const { isDark } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      const defaultStyle: BarStyle = isDark ? 'light' : 'dark';
      setStatusBarStyle(statusBarStyle || defaultStyle, true);

      return () => {
        setStatusBarStyle(defaultStyle, true);
      };
    }, [statusBarStyle, isDark])
  );
}
