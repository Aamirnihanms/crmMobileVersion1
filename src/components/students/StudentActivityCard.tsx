import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { StudentActivity } from '../../api/studentActivities.api';
import { useAppTheme, spacing } from '@/src/theme';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';

// Map activity_type → icon
const ACTIVITY_ICONS: Record<string, string> = {
  payment_completed: 'checkmark-circle-outline',
  payment_received: 'cash-outline',
  payment_added: 'add-circle-outline',
  payment_order_created: 'receipt-outline',
  profile_update: 'create-outline',
  receipt_generated: 'document-text-outline',
  enrollment_created: 'school-outline',
  batch_changed: 'swap-horizontal-outline',
  status_changed: 'refresh-circle-outline',
};

// Map activity_type → accent color
const getActivityColors = (colors: any): Record<string, string> => ({
  payment_completed: colors.successStrong,
  payment_received: colors.successStrong,
  payment_added: colors.successStrong,
  payment_order_created: '#F59E0B',
  profile_update: colors.primary,
  receipt_generated: '#8B5CF6',
  enrollment_created: colors.primary,
  batch_changed: '#F59E0B',
  status_changed: '#F59E0B',
});

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function StudentActivityCard({
  activity,
}: {
  activity: StudentActivity;
}) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const icon =
    (ACTIVITY_ICONS[activity.activity_type] as any) || 'ellipse-outline';
  const accent =
    getActivityColors(colors)[activity.activity_type] || colors.primary;

  const actor = activity.performed_by
    ? activity.performed_by.full_name
    : 'System';

  const isSystem = !activity.performed_by;

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accent + '18' },
          ]}
        >
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <View style={styles.titleSection}>
          <AppText variant="subtitle" style={styles.title}>
            {activity.title}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {formatDateTime(activity.created_at)}
          </AppText>
        </View>
        {activity.amount && (
          <View style={[styles.amountBadge, { backgroundColor: accent + '15' }]}>
            <AppText
              variant="caption"
              style={[styles.amountText, { color: accent }]}
            >
              ₹{parseFloat(activity.amount).toLocaleString('en-IN')}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <AppText style={styles.desc} color={colors.textSecondary}>
          {activity.description}
        </AppText>
      </View>

      <View style={styles.footer}>
        <View style={styles.actorRow}>
          <Ionicons
            name={isSystem ? 'settings-outline' : 'person-outline'}
            size={12}
            color={colors.textMuted}
          />
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={styles.actorText}
          >
            {'Performed by '}
            <AppText
              variant="caption"
              style={{ fontWeight: '700' }}
              color={isSystem ? colors.primary : colors.secondary}
            >
              {actor}
            </AppText>
            {activity.performed_by?.branch
              ? ` · ${activity.performed_by.branch}`
              : ''}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
  },
  amountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  amountText: {
    fontWeight: '800',
    fontSize: 12,
  },
  content: {
    paddingLeft: 48,
  },
  desc: {
    lineHeight: 18,
    fontSize: 13,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    borderStyle: 'dashed',
    paddingLeft: 48,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actorText: {
    marginLeft: 4,
  },
});
