import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { FollowUp } from '../../api/followups.api';
import { colors, spacing } from '../../theme';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';

export default function FollowUpCard({
  followup,
  onUpdateStatus,
}: {
  followup: FollowUp;
  onUpdateStatus: () => void;
}) {
  const isPending = followup.status === 'pending';
  const isCompleted = followup.status === 'completed';
  const statusColor = isCompleted ? colors.success : colors.primary;

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted} style={styles.dateText}>
            {new Date(followup.next_follow_up_date).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </AppText>
          <View style={styles.dot} />
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted} style={styles.dateText}>
            {new Date(followup.next_follow_up_date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </AppText>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <AppText variant="caption" style={[styles.statusText, { color: statusColor }]}>
            {followup.status}
          </AppText>
        </View>
      </View>

      <AppText style={styles.note} color={colors.textPrimary}>
        {followup.notes || 'No notes provided'}
      </AppText>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.authorRow}>
          <View style={styles.avatarMini}>
            <AppText variant="caption" color={colors.primary} style={{ fontSize: 8, fontWeight: '700' }}>
              {followup.created_by.full_name[0]}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textSecondary}>
            By {followup.created_by.full_name}
          </AppText>
        </View>

        {isPending && (
          <Pressable onPress={onUpdateStatus} style={styles.updateBtn}>
            <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>
              Update Status
            </AppText>
            <Ionicons name="chevron-forward" size={12} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  note: {
    marginVertical: spacing.sm,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
});
