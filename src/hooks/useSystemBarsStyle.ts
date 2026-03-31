import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';

type BarStyle = 'light' | 'dark';

type UseSystemBarsStyleOptions = {
  statusBarStyle?: BarStyle;
};

const DEFAULT_STATUS_BAR_STYLE: BarStyle = 'dark';

export default function useSystemBarsStyle({
  statusBarStyle = DEFAULT_STATUS_BAR_STYLE,
}: UseSystemBarsStyleOptions = {}) {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(statusBarStyle, true);

      return () => {
        setStatusBarStyle(DEFAULT_STATUS_BAR_STYLE, true);
      };
    }, [statusBarStyle])
  );
}
