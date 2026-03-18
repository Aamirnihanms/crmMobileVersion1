import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/src/theme';
import AppText from '@/src/components/common/AppText';

export type LeadsFilters = {
  course?: number | null;
  counselor?: number | null;
  qualification?: number | null;
  lead_status?: number | null;
  lead_source?: string | null;
};

type Props = {
  onPress: () => void;
  filters: LeadsFilters;
};

export default function LeadsFilterBar({
  onPress,
  filters,
}: Props) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={onPress}>
        <Ionicons
          name="options-outline"
          size={20}
          color={colors.primary}
        />

        {activeCount > 0 && (
          <View style={styles.badge}>
            <AppText color="#fff">{activeCount}</AppText>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  button: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});