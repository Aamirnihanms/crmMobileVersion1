import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/src/theme';
import { callNumber, openWhatsApp } from '../../utils/contactActions';
import AppText from '../common/AppText';

type Props = {
  lead: any;
  onConvertPress?: () => void;
  onEditPress?: () => void;
};

export default function LeadHeader({
  lead,
  onConvertPress,
  onEditPress,
}: Props) {
  const statusColor = lead.lead_status_details?.color || colors.primary;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primaryLight + '20', colors.background]}
        style={styles.headerGradient}
      />

      <View style={styles.headerContent}>
        <View style={styles.topRow}>
          <View style={styles.nameSection}>
            <AppText variant="h2" style={styles.name}>
              {lead.name || 'Unnamed Lead'}
            </AppText>
            <View style={[styles.statusBadge, {
              backgroundColor: statusColor.startsWith('#')
                ? statusColor + '15'
                : statusColor.replace(/,?\s*[\d.]+\)$/, ', 0.15)'),
            }]}>
              <View style={[styles.statusDot, {
                backgroundColor: statusColor.startsWith('rgba')
                  ? statusColor.replace(/,?\s*[\d.]+\)$/, ', 1)')
                  : statusColor
              }]} />
              <AppText variant="caption" style={[styles.statusText, {
                color: statusColor.startsWith('rgba')
                  ? statusColor.replace(/,?\s*[\d.]+\)$/, ', 1)')
                  : statusColor
              }]}>
                {lead.lead_status_details?.name}
              </AppText>
            </View>
          </View>

          {onEditPress && (
            <Pressable onPress={onEditPress} style={styles.editBtn}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </Pressable>
          )}
        </View>

        <View style={styles.actionsGrid}>
          <ActionCard
            icon="call-outline"
            label="Call"
            onPress={() => callNumber(lead.phone_number)}
            disabled={!lead.phone_number}
          />
          <ActionCard
            icon="logo-whatsapp"
            label="WhatsApp"
            onPress={() => openWhatsApp(lead.whatsapp_number)}
            disabled={!lead.whatsapp_number}
            color={colors.whatsapp}
          />
          {/* <ActionCard
            icon="mail-outline"
            label="Email"
            onPress={() => openEmail(lead.email)}
            disabled={!lead.email}
          /> */}
          <ActionCard
            icon="school-outline"
            label="Convert"
            onPress={onConvertPress}
            disabled={!onConvertPress}
          />
        </View>
      </View>
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
        pressed && styles.pressedCard
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
  container: {
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
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
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
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
