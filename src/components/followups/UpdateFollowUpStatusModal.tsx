import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import AppText from '../common/AppText';
import { spacing, colors } from '../../theme';

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
  const [status, setStatus] =
    React.useState<Status>('completed');

  const [methods, setMethods] = React.useState<Method[]>([]);
  const [callDuration, setCallDuration] = React.useState('');
  const [whatsappMessage, setWhatsappMessage] =
    React.useState('');
  const [remark, setRemark] = React.useState('');

  const toggleMethod = (m: Method) => {
    setMethods((prev) =>
      prev.includes(m)
        ? prev.filter((x) => x !== m)
        : [...prev, m]
    );
  };

  const submit = () => {
    // validation
    if (status === 'completed') {
      if (!methods.length) return;
      if (
        methods.includes('phone') &&
        !callDuration
      )
        return;
      if (
        methods.includes('whatsapp') &&
        !whatsappMessage
      )
        return;
    }

    const payload: any = {
      status,
      lead: leadId,
      notes: followup.notes,
      importance: followup.importance,
      next_follow_up_date:
        followup.next_follow_up_date,
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
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <AppText variant="subtitle">
            Update Follow-up
          </AppText>

          {/* STATUS */}
          <View style={styles.row}>
            {(['completed', 'postponed', 'canceled'] as Status[]).map(
              (s) => (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.chip,
                    status === s && styles.activeChip,
                  ]}
                >
                  <AppText
                    style={
                      status === s
                        ? styles.activeText
                        : undefined
                    }
                  >
                    {s.toUpperCase()}
                  </AppText>
                </Pressable>
              )
            )}
          </View>

          {/* COMPLETED ONLY */}
          {status === 'completed' && (
            <>
              <AppText style={styles.label}>
                Follow-up Method
              </AppText>

              <View style={styles.row}>
                {(['phone', 'whatsapp'] as Method[]).map(
                  (m) => (
                    <Pressable
                      key={m}
                      onPress={() => toggleMethod(m)}
                      style={[
                        styles.chip,
                        methods.includes(m) &&
                          styles.activeChip,
                      ]}
                    >
                      <AppText
                        style={
                          methods.includes(m)
                            ? styles.activeText
                            : undefined
                        }
                      >
                        {m}
                      </AppText>
                    </Pressable>
                  )
                )}
              </View>

              {methods.includes('phone') && (
                <TextInput
                  placeholder="Call duration (minutes)"
                  value={callDuration}
                  onChangeText={setCallDuration}
                  keyboardType="numeric"
                  style={styles.input}
                />
              )}

              {methods.includes('whatsapp') && (
                <TextInput
                  placeholder="WhatsApp message"
                  value={whatsappMessage}
                  onChangeText={setWhatsappMessage}
                  style={styles.input}
                />
              )}

              <TextInput
                placeholder="Remark"
                value={remark}
                onChangeText={setRemark}
                style={styles.input}
              />
            </>
          )}

          {/* ACTIONS */}
          <View style={styles.actions}>
            <Pressable onPress={onClose}>
              <AppText>Cancel</AppText>
            </Pressable>

            <Pressable onPress={submit}>
              <AppText color={colors.primary}>
                Save
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  card: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  activeText: {
    color: 'white',
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
});
