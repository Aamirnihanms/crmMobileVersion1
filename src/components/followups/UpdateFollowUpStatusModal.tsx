import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { colors, spacing } from '@/src/theme';
import AppText from '../common/AppText';

type Method = 'phone' | 'whatsapp';
type Status = 'completed' | 'postponed' | 'canceled';

export default function UpdateFollowUpStatusModal({
  visible,
  followup,
  leadId,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  followup: any;
  leadId: string;
  onClose: () => void;
  onSubmit: (payload: any) => void;
}) {
  const [status, setStatus] = React.useState<Status>('completed');
  const [methods, setMethods] = React.useState<Method[]>([]);
  const [callDuration, setCallDuration] = React.useState('');
  const [whatsappMessage, setWhatsappMessage] = React.useState('');
  const [remark, setRemark] = React.useState('');

  const toggleMethod = (m: Method) => {
    setMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const submit = () => {
    if (status === 'completed') {
      if (!methods.length) return;
      if (methods.includes('phone') && !callDuration) return;
      if (methods.includes('whatsapp') && !whatsappMessage) return;
    }

    const payload: any = {
      status,
      lead: leadId,
      notes: followup.notes,
      importance: followup.importance,
      next_follow_up_date: followup.next_follow_up_date,
    };

    if (status === 'completed') {
      payload.follow_up_methods = methods;
      payload.call_duration = callDuration;
      payload.whatsapp_message = whatsappMessage;
      payload.remark = remark;
    }

    onSubmit(payload);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.indicator} />

          <View style={styles.header}>
            <AppText variant="h2">Update Status</AppText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText style={styles.label}>Outcome</AppText>
            <View style={styles.statusRow}>
              {(['completed', 'postponed', 'canceled'] as Status[]).map((s) => {
                const isActive = status === s;
                const activeColor = s === 'completed' ? colors.success : s === 'canceled' ? colors.danger : colors.warning;

                return (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[
                      styles.chip,
                      isActive && { backgroundColor: activeColor + '15', borderColor: activeColor }
                    ]}
                  >
                    <AppText
                      style={[
                        styles.chipText,
                        isActive && { color: activeColor, fontWeight: '700' }
                      ]}
                    >
                      {s.toUpperCase()}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {status === 'completed' && (
              <View style={styles.completedSection}>
                <AppText style={styles.label}>How did you connect?</AppText>
                <View style={[styles.statusRow, { marginBottom: spacing.lg }]}>
                  {(['phone', 'whatsapp'] as Method[]).map((m) => {
                    const isActive = methods.includes(m);
                    return (
                      <Pressable
                        key={m}
                        onPress={() => toggleMethod(m)}
                        style={[
                          styles.chip,
                          isActive && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                        ]}
                      >
                        <View style={styles.methodIconRow}>
                          <Ionicons
                            name={m === 'phone' ? 'call-outline' : 'logo-whatsapp'}
                            size={14}
                            color={isActive ? colors.primary : colors.textMuted}
                          />
                          <AppText
                            style={[
                              styles.chipText,
                              isActive && { color: colors.primary, fontWeight: '700' }
                            ]}
                          >
                            {m.toUpperCase()}
                          </AppText>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {methods.includes('phone') && (
                  <>
                    <AppText style={styles.label}>Call Duration</AppText>
                    <TextInput
                      placeholder="Duration in minutes"
                      value={callDuration}
                      onChangeText={setCallDuration}
                      keyboardType="numeric"
                      style={styles.input}
                      placeholderTextColor={colors.textMuted}
                    />
                  </>
                )}

                {methods.includes('whatsapp') && (
                  <>
                    <AppText style={styles.label}>WhatsApp Message Content</AppText>
                    <TextInput
                      placeholder="What did you discuss?"
                      value={whatsappMessage}
                      onChangeText={setWhatsappMessage}
                      multiline
                      style={[styles.input, { minHeight: 80 }]}
                      placeholderTextColor={colors.textMuted}
                    />
                  </>
                )}

                <AppText style={styles.label}>Additional Remarks</AppText>
                <TextInput
                  placeholder="Any extra info..."
                  value={remark}
                  onChangeText={setRemark}
                  style={styles.input}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            <View style={styles.footer}>
              <Pressable onPress={submit} style={{ flex: 1 }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.saveBtn}
                >
                  <AppText style={styles.saveBtnText}>Save Status</AppText>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dismissArea: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '85%',
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    minWidth: '28%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.divider,
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  methodIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedSection: {
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.primaryLight + '10',
    borderRadius: 16,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: spacing.md,
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});
