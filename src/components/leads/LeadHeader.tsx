import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../common/AppText';
import { spacing, colors } from '../../theme';
import { callNumber, openWhatsApp } from '../../utils/contactActions';

type Props = {
  lead: any;
  onConvertPress?: () => void; // ✅ NEW PROP
};

export default function LeadHeader({
  lead,
  onConvertPress,
}: Props) {
  return (
    <View style={styles.container}>
      {/* NAME */}
      <AppText variant="title">
        {lead.name || 'Unnamed Lead'}
      </AppText>

      {/* STATUS BAR */}
      <View style={styles.statusRow}>
        <Ionicons name="chevron-back" size={18} color="white" />

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: lead.lead_status_details.color },
          ]}
        >
          <AppText style={styles.statusText}>
            {lead.lead_status_details.name}
          </AppText>
        </View>

        <Ionicons name="chevron-forward" size={18} color="white" />
      </View>

      {/* ACTIONS */}
      <View style={styles.actionsRow}>
        {/* CALL */}
        <Pressable
          disabled={!lead.phone_number}
          style={[
            styles.actionButton,
            !lead.phone_number && styles.disabled,
          ]}
          onPress={() => callNumber(lead.phone_number)}
        >
          <Ionicons
            name="call-outline"
            size={18}
            color={colors.primary}
          />
          <AppText>Call</AppText>
        </Pressable>

        {/* WHATSAPP */}
        <Pressable
          disabled={!lead.whatsapp_number}
          style={[
            styles.actionButton,
            !lead.whatsapp_number && styles.disabled,
          ]}
          onPress={() => openWhatsApp(lead.whatsapp_number)}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          <AppText>WhatsApp</AppText>
        </Pressable>

        {/* ✅ CONVERT TO STUDENT */}
        <Pressable
          disabled={!onConvertPress}
          style={[
            styles.actionButton,
            !onConvertPress && styles.disabled,
          ]}
          onPress={onConvertPress}
        >
          <Ionicons
            name="school-outline"
            size={18}
            color={colors.primary}
          />
          <AppText>Convert</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  statusBadge: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  disabled: {
    opacity: 0.4,
  },
});