import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useAppTheme, spacing } from '@/src/theme';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';
import type { CompanyResponse } from '../../api/jobs.api';

type CompanyCardProps = {
  company: CompanyResponse;
  onPress?: () => void;
};

export default function CompanyCard({ company, onPress }: CompanyCardProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const initials = company.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppCard style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        {/* Logo / Initials */}
        <View style={styles.logoContainer}>
          {company.logo ? (
            <Image source={{ uri: company.logo }} style={styles.logo} />
          ) : (
            <AppText style={styles.initials}>{initials}</AppText>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <AppText variant="subtitle" style={styles.name} numberOfLines={1}>
              {company.name}
            </AppText>
            <View style={[styles.statusDot, company.is_active ? styles.dotActive : styles.dotInactive]} />
          </View>

          {company.contact_email && (
            <View style={styles.detailItem}>
              <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textMuted} style={styles.detailText} numberOfLines={1}>
                {company.contact_email}
              </AppText>
            </View>
          )}

          {company.contact_phone && (
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={13} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textMuted} style={styles.detailText}>
                {company.contact_phone}
              </AppText>
            </View>
          )}
        </View>
      </View>

      {(company.address || company.representatives.length > 0) && (
        <View style={styles.footer}>
          {company.address && (
            <View style={styles.footerItem}>
              <Ionicons name="location-outline" size={13} color={colors.primary} />
              <AppText variant="caption" color={colors.textMuted} style={styles.footerText} numberOfLines={1}>
                {company.address.replace(/\r?\n/g, ', ')}
              </AppText>
            </View>
          )}
          {company.representatives.length > 0 && (
            <View style={styles.footerItem}>
              <Ionicons name="people-outline" size={13} color={colors.info} />
              <AppText variant="caption" color={colors.textMuted} style={styles.footerText}>
                {company.representatives.length} Rep{company.representatives.length !== 1 ? 's' : ''}
              </AppText>
            </View>
          )}
        </View>
      )}
    </AppCard>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 18,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.success,
  },
  dotInactive: {
    backgroundColor: colors.textMuted,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  detailText: {
    flex: 1,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
  },
});
