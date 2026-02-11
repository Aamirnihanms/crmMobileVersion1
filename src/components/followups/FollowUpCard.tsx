import { View, StyleSheet, Pressable } from 'react-native';
import AppText from '../common/AppText';
import { spacing, colors } from '../../theme';
import type { FollowUp } from '../../api/followups.api';

export default function FollowUpCard({
  followup,
  onUpdateStatus,
}: {
  followup: FollowUp;
  onUpdateStatus: () => void;
}) {
  const isPending = followup.status === 'pending';
  const isCompleted = followup.status === 'completed';

  return (
    <View style={styles.card}>
      <AppText variant="caption" color={colors.textSecondary}>
        {new Date(followup.next_follow_up_date).toLocaleString()}
      </AppText>

      <AppText style={styles.note}>
        {followup.notes || '—'}
      </AppText>

      <View style={styles.footer}>
        <AppText
          variant="caption"
          color={isCompleted ? 'green' : colors.primary}
        >
            {followup.status}
        </AppText>

        {isPending && (
          <Pressable onPress={onUpdateStatus}>
            <AppText color={colors.primary}>
              Update Status
            </AppText>
          </Pressable>
        )}
      </View>

      <AppText variant="caption" color={colors.textSecondary}>
        By {followup.created_by.full_name}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  note: {
    marginVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
});
