import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/src/theme';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';

export type Lead = {
  id: string;
  name: string | null;
  phone_number: string;
  lead_status_details: {
    name: string;
    color: string;
    value: string;
  };
  lead_source_details?: {
    label: string;
  } | null;
  course_details?: {
    course_name: string;
  } | null;
  counselor_details?: {
    full_name: string;
  } | null;
  created_at?: string;
};

type LeadCardProps = {
  lead: Lead;
  onPress?: () => void;
};

const LeadCard = memo(({ lead, onPress }: LeadCardProps) => {
  const initials = lead.name
    ? lead.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <Pressable onPress={onPress}>
      <AppCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initials}</AppText>
          </View>
          <View style={styles.mainInfo}>
            <View style={styles.nameRow}>
              <AppText variant="subtitle" style={styles.name} numberOfLines={1}>
                {lead.name ?? 'Unknown Lead'}
              </AppText>
              <View style={[styles.badge, {
                backgroundColor: lead.lead_status_details.color.startsWith('#')
                  ? lead.lead_status_details.color + '15'
                  : lead.lead_status_details.color.replace(/,?\s*[\d.]+\)$/, ', 0.15)'),
                borderColor: lead.lead_status_details.color.startsWith('rgba')
                  ? lead.lead_status_details.color.replace(/,?\s*[\d.]+\)$/, ', 1)')
                  : lead.lead_status_details.color
              }]}>
                <AppText style={[styles.badgeText, {
                  color: lead.lead_status_details.color.startsWith('rgba')
                    ? lead.lead_status_details.color.replace(/,?\s*[\d.]+\)$/, ', 1)')
                    : lead.lead_status_details.color
                }]}>
                  {lead.lead_status_details.name}
                </AppText>
              </View>
            </View>
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.detailText}>
                  {lead.phone_number}
                </AppText>
              </View>
              {lead.created_at && (
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                  <AppText variant="caption" color={colors.textSecondary} style={styles.detailText}>
                    {new Date(lead.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons name="book-outline" size={12} color={colors.primary} />
            <AppText variant="caption" numberOfLines={1} style={styles.footerText}>
              {lead.course_details?.course_name ?? 'No Course'}
            </AppText>
          </View>
          {lead.counselor_details?.full_name && (
            <View style={styles.footerItem}>
              <Ionicons name="person-outline" size={12} color={colors.info} />
              <AppText variant="caption" numberOfLines={1} style={styles.footerText}>
                {lead.counselor_details.full_name}
              </AppText>
            </View>
          )}
          {lead.lead_source_details?.label && (
            <View style={styles.footerItem}>
              <Ionicons name="megaphone-outline" size={12} color={colors.secondary} />
              <AppText variant="caption" numberOfLines={1} style={styles.footerText}>
                {lead.lead_source_details.label}
              </AppText>
            </View>
          )}
        </View>
      </AppCard>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.lead.id === nextProps.lead.id &&
    prevProps.lead.name === nextProps.lead.name &&
    prevProps.lead.phone_number === nextProps.lead.phone_number &&
    prevProps.lead.created_at === nextProps.lead.created_at &&
    prevProps.lead.lead_status_details.value === nextProps.lead.lead_status_details.value &&
    prevProps.lead.lead_status_details.color === nextProps.lead.lead_status_details.color &&
    prevProps.lead.course_details?.course_name === nextProps.lead.course_details?.course_name &&
    prevProps.lead.counselor_details?.full_name === nextProps.lead.counselor_details?.full_name &&
    prevProps.lead.lead_source_details?.label === nextProps.lead.lead_source_details?.label
  );
});

LeadCard.displayName = 'LeadCard';

export default LeadCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryLight + '40',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  mainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
});
