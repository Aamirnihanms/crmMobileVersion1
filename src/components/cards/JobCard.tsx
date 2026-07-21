import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

import { useAppTheme, spacing } from '@/src/theme';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';
import type { JobResponse } from '../../api/jobs.api';

type JobCardProps = {
  job: JobResponse;
  onPress?: () => void;
};

export default function JobCard({ job, onPress }: JobCardProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const isExpired = job.is_expired;

  return (
    <AppCard style={styles.card} onPress={onPress}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <AppText variant="h3" style={styles.title} numberOfLines={1}>
              {job.title}
            </AppText>
            <View style={styles.companyRow}>
              {job.company.logo ? (
                <Image source={{ uri: job.company.logo }} style={styles.logo} />
              ) : (
                <Ionicons name="business-outline" size={16} color={colors.textMuted} style={styles.companyIcon} />
              )}
              <AppText variant="caption" color={colors.textPrimary} style={styles.companyName}>
                {job.company.name}
              </AppText>
            </View>
          </View>
          
          <View style={[styles.statusBadge, isExpired ? styles.statusExpired : styles.statusActive]}>
            <AppText
              variant="caption"
              color={isExpired ? colors.danger : colors.success}
              style={styles.statusText}
            >
              {isExpired ? 'Expired' : 'Active'}
            </AppText>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <AppText variant="caption" color={colors.textMuted} style={styles.detailText} numberOfLines={1}>
              {job.location || 'Not specified'}
            </AppText>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color={colors.textMuted} />
            <AppText variant="caption" color={colors.textMuted} style={styles.detailText}>
              {job.applications_count} Application{job.applications_count !== 1 ? 's' : ''}
            </AppText>
          </View>
        </View>
      </AppCard>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: spacing.xs,
    backgroundColor: colors.surfaceSubtle,
  },
  companyIcon: {
    marginRight: spacing.xs,
  },
  companyName: {
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: colors.success + '15',
    borderColor: colors.success + '30',
  },
  statusExpired: {
    backgroundColor: colors.danger + '15',
    borderColor: colors.danger + '30',
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
});
