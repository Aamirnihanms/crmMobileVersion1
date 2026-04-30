import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/src/theme';
import AppText from '@/src/components/common/AppText';
import AppSelect from '@/src/components/common/AppSelect';
import AppInput from '@/src/components/common/AppInput';
import AppButton from '@/src/components/common/AppButton';
import { AttendanceMode } from '@/src/api/attendance.api';
import { useUpdateAttendance } from '@/src/queries/attendance.query';

interface AttendanceEditModalProps {
  visible: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
  date: string;
  currentStatus: string;
  currentReason: string | null;
  batchId: string;
}

export default function AttendanceEditModal({
  visible,
  onClose,
  studentName,
  studentId,
  date,
  currentStatus,
  currentReason,
  batchId,
}: AttendanceEditModalProps) {
  const [mainStatus, setMainStatus] = useState<'present' | 'absent' | 'recording'>('present');
  const [subStatus, setSubStatus] = useState<'online' | 'offline'>('offline');
  const [reason, setReason] = useState(currentReason || 'No Remark');
  
  const updateMutation = useUpdateAttendance();

  // Initialize state based on current status
  useEffect(() => {
    if (visible) {
      if (currentStatus === 'online' || currentStatus === 'offline') {
        setMainStatus('present');
        setSubStatus(currentStatus as 'online' | 'offline');
      } else if (currentStatus === 'absent' || currentStatus === 'recording') {
        setMainStatus(currentStatus as 'absent' | 'recording');
      }
      setReason(currentReason || 'No Remark');
    }
  }, [visible, currentStatus, currentReason]);

  const handleSubmit = async () => {
    const isPresent = mainStatus === 'present';
    const finalStatus = isPresent ? subStatus : mainStatus;
    const finalReason = isPresent ? 'No Remark' : reason;
    
    if (!isPresent && (!reason || reason === 'No Remark')) {
       Alert.alert('Reason Required', `Please provide a reason for ${mainStatus} status.`);
       return;
    }

    updateMutation.mutate({
      batch_id: batchId,
      student_id: studentId,
      date: date,
      status: finalStatus as AttendanceMode | 'absent',
      reason: finalReason,
    }, {
      onSuccess: () => {
        onClose();
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || 'Failed to update attendance';
        Alert.alert('Error', msg);
      }
    });
  };

  const mainStatusOptions = [
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Recording', value: 'recording' },
  ];

  const subStatusOptions = [
    { label: 'Offline', value: 'offline' },
    { label: 'Online', value: 'online' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior="padding"
        style={styles.overlay}
      >
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.indicator} />
          
          <View style={styles.header}>
            <View>
              <AppText variant="h2">Edit Attendance</AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {studentName} • {date}
              </AppText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.section}>
              <AppText style={styles.label}>Attendance Status</AppText>
              <View style={styles.radioGroup}>
                {mainStatusOptions.map((opt) => (
                  <Pressable 
                    key={opt.value} 
                    onPress={() => setMainStatus(opt.value as any)}
                    style={[
                      styles.radioButton,
                      mainStatus === opt.value && styles.radioButtonActive
                    ]}
                  >
                    <AppText style={[
                      styles.radioText,
                      mainStatus === opt.value && styles.radioTextActive
                    ]}>{opt.label}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            {mainStatus === 'present' && (
              <View style={styles.section}>
                <AppText style={styles.label}>Mode</AppText>
                <View style={styles.radioGroup}>
                  {subStatusOptions.map((opt) => (
                    <Pressable 
                      key={opt.value} 
                      onPress={() => setSubStatus(opt.value as any)}
                      style={[
                        styles.radioButton,
                        subStatus === opt.value && styles.radioButtonActive
                      ]}
                    >
                      <AppText style={[
                        styles.radioText,
                        subStatus === opt.value && styles.radioTextActive
                      ]}>{opt.label}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {(mainStatus === 'absent' || mainStatus === 'recording') && (
              <View style={styles.section}>
                <AppInput
                  label="Reason / Note"
                  placeholder="Enter reason for absence..."
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.footer}>
              <AppButton 
                title={updateMutation.isPending ? 'Updating...' : 'Save Changes'} 
                onPress={handleSubmit}
                loading={updateMutation.isPending}
                variant="primary"
              />
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dismissArea: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '80%',
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: spacing.xl * 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  radioButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  radioText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  radioTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    marginTop: spacing.md,
  },
});
