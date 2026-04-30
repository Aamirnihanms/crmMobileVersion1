import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import { Ionicons } from '@expo/vector-icons';

import { StudentsStackParamList } from '@/src/navigation/StudentsStack';
import ConvertedLeadDetailsTabs from '@/src/navigation/ConvertedLeadDetailsTabs';
import { useConvertedLeadDetails } from '@/src/queries/leadDetails.query';
import { colors, spacing } from '@/src/theme';
import { callNumber, openWhatsApp } from '@/src/utils/contactActions';

type Nav = NativeStackNavigationProp<StudentsStackParamList, 'ConvertedLeadHistory'>;

export default function ConvertedLeadHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const route: any = useRoute();
  const { leadId } = route.params;

  const { data, isLoading, isError, error, refetch } = useConvertedLeadDetails(leadId);

  if (isLoading) return <AppLoader />;

  if (isError) {
    const errorDetail = (error as any)?.response?.data?.detail;
    const errorMessage = (error as any)?.response?.data?.error;
    const fallbackMessage = (error as Error)?.message || 'Failed to load lead history';
    const displayMessage = errorDetail || errorMessage || fallbackMessage;

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={styles.errorText}>
          {displayMessage}
        </AppText>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

  if (!data) return null;

  const statusColor = data.lead_status_details?.color || colors.primary;

  return (
    <View style={styles.flex}>
      {/* ─── Header ─── */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[colors.primaryLight + '20', colors.background]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.headerContent}>
          {/* Name + Status + View-Only badge */}
          <View style={styles.topRow}>
            <View style={styles.nameSection}>
              <AppText variant="h2" style={styles.name}>
                {data.name || 'Unnamed Lead'}
              </AppText>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusColor.startsWith('#')
                      ? statusColor + '18'
                      : statusColor.replace(/,?\s*[\d.]+\)$/, ', 0.15)'),
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: statusColor.startsWith('rgba')
                        ? statusColor.replace(/,?\s*[\d.]+\)$/, ', 1)')
                        : statusColor,
                    },
                  ]}
                />
                <AppText
                  variant="caption"
                  style={[
                    styles.statusText,
                    {
                      color: statusColor.startsWith('rgba')
                        ? statusColor.replace(/,?\s*[\d.]+\)$/, ', 1)')
                        : statusColor,
                    },
                  ]}
                >
                  {data.lead_status_details?.name}
                </AppText>
              </View>
            </View>

            <View style={styles.viewOnlyBadge}>
              <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
              <AppText style={styles.viewOnlyText}>View Only</AppText>
            </View>
          </View>

          {/* Action cards (call/whatsapp — no convert) */}
          <View style={styles.actionsGrid}>
            <ActionCard
              icon="call-outline"
              label="Call"
              onPress={() => callNumber(data.phone_number)}
              disabled={!data.phone_number}
            />
            <ActionCard
              icon="logo-whatsapp"
              label="WhatsApp"
              onPress={() => openWhatsApp(data.whatsapp_number)}
              disabled={!data.whatsapp_number}
              color={colors.whatsapp}
            />
          </View>
        </View>
      </View>

      {/* ─── Tabs ─── */}
      <ConvertedLeadDetailsTabs leadId={leadId} />
    </View>
  );
}

function ActionCard({ icon, label, onPress, disabled, color = colors.primary }: any) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionCard,
        disabled && styles.disabledCard,
        pressed && styles.pressedCard,
      ]}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: color + (disabled ? '10' : '15') }]}>
        <Ionicons name={icon} size={20} color={disabled ? colors.textMuted : color} />
      </View>
      <AppText variant="caption" style={[styles.actionLabel, disabled && { color: colors.textMuted }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
  },

  /* Header */
  headerContainer: {
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  headerContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  nameSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  viewOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border || '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewOnlyText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },

  /* Action cards */
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pressedCard: {
    backgroundColor: colors.background,
    transform: [{ scale: 0.98 }],
  },
  disabledCard: {
    opacity: 0.5,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontWeight: '600',
    fontSize: 11,
  },
});
