import AppText from '@/src/components/common/AppText';
import { useAppTheme, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

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
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, activeCount > 0 && styles.buttonActive]}
        onPress={onPress}
      >
        <Ionicons
          name={activeCount > 0 ? "funnel" : "funnel-outline"}
          size={18}
          color={activeCount > 0 ? colors.primary : colors.textMuted}
        />
        <AppText
          variant="caption"
          style={[styles.buttonText, activeCount > 0 && { color: colors.primary, fontWeight: '700' }]}
        >
          Filters
        </AppText>

        {activeCount > 0 && (
          <View style={styles.badge}>
            <AppText color={colors.surface} style={styles.badgeText}>{activeCount}</AppText>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: colors.background,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: colors.primaryLight + '15',
    borderColor: colors.primaryLight + '30',
  },
  buttonText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});