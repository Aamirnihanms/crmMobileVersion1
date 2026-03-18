import {
  NavigationContainer,
  DefaultTheme,
} from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './src/lib/queryClient';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer theme={appTheme}>
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
