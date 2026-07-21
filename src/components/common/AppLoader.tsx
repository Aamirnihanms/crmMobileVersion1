import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/src/theme';

export default function AppLoader() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
