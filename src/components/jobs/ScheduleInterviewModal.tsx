import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import AppButton from '@/src/components/common/AppButton';
import AppDatePicker from '@/src/components/common/AppDatePicker';
import AppInput from '@/src/components/common/AppInput';
import AppText from '@/src/components/common/AppText';
import { useCreateInterview, useJobStages, useUpdateInterview } from '@/src/queries/jobs.query';
import { useAppTheme, spacing } from '@/src/theme';
import type { CreateInterviewPayload, UpdateInterviewPayload } from '@/src/api/jobs.api';

type Props = {
  visible: boolean;
  companyUid: string;
  jobUid: string;
  applicationUid: string;
  defaultStageUid?: string;
  editingInterview?: any;
  onClose: () => void;
};

function getStageColor(code: string, colors: any): string {
  const STAGE_COLORS: Record<string, string> = {
    applied: colors.info,
    screening: colors.warning,
    interview: '#7C3AED',
    offer: colors.success,
    rejected: colors.danger,
  };
  return STAGE_COLORS[code] || colors.primary;
}

const ATTENDANCE_OPTIONS = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Rescheduled', value: 'rescheduled' },
];

const ymdFromIso = (iso: string | null | undefined): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const timeFromIso = (iso: string | null | undefined): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
};

export default function ScheduleInterviewModal({
  visible,
  companyUid,
  jobUid,
  applicationUid,
  defaultStageUid,
  editingInterview,
  onClose,
}: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const isEdit = !!editingInterview;
  const createMutation = useCreateInterview(companyUid, jobUid);
  const updateMutation = useUpdateInterview(companyUid, jobUid);
  const mutation = isEdit ? updateMutation : createMutation;

  const [selectedStageUid, setSelectedStageUid] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState<'online' | 'offline'>('online');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');
  const [attendance, setAttendance] = useState('scheduled');
  const [stagePickerOpen, setStagePickerOpen] = useState(false);
  const [attendancePickerOpen, setAttendancePickerOpen] = useState(false);

  const { data: stagesResponse } = useJobStages(companyUid, jobUid);

  const sortedStages = useMemo(() => {
    if (!stagesResponse?.results) return [];
    return [...stagesResponse.results].sort((a, b) => a.sort_order - b.sort_order);
  }, [stagesResponse]);

  useEffect(() => {
    if (visible) {
      if (editingInterview) {
        setSelectedStageUid(editingInterview.stage_uid || '');
        setDate(ymdFromIso(editingInterview.scheduled_at));
        setTime(timeFromIso(editingInterview.scheduled_at));
        setMode(editingInterview.mode || 'online');
        setMeetingLink(editingInterview.meeting_link || '');
        setLocation(editingInterview.location || '');
        setFeedback(editingInterview.feedback || '');
        setScore(editingInterview.score != null ? String(editingInterview.score) : '');
        setAttendance(editingInterview.attendance || 'scheduled');
      } else {
        setSelectedStageUid(defaultStageUid || '');
        setDate('');
        setTime('');
        setMode('online');
        setMeetingLink('');
        setLocation('');
        setFeedback('');
        setScore('');
        setAttendance('scheduled');
      }
      setStagePickerOpen(false);
      setAttendancePickerOpen(false);
    }
  }, [visible, defaultStageUid, editingInterview]);

  const handleClose = useCallback(() => {
    if (mutation.isPending) return;
    onClose();
  }, [mutation.isPending, onClose]);

  const selectedStage = sortedStages.find((s) => s.uid === selectedStageUid);

  const handleSubmit = async () => {
    if (!selectedStageUid) {
      Alert.alert('Validation', 'Please select a stage.');
      return;
    }
    if (!date) {
      Alert.alert('Validation', 'Please select a date.');
      return;
    }
    if (!time) {
      Alert.alert('Validation', 'Please select a time.');
      return;
    }
    if (mode === 'online' && !meetingLink.trim()) {
      Alert.alert('Validation', 'Please enter a meeting link.');
      return;
    }
    if (mode === 'offline' && !location.trim()) {
      Alert.alert('Validation', 'Please enter a location.');
      return;
    }

    const scheduledAt = `${date}T${time}:00.000Z`;

    try {
      if (isEdit && editingInterview) {
        const payload: UpdateInterviewPayload = {
          stage_uid: selectedStageUid,
          scheduled_at: scheduledAt,
          mode,
          attendance: attendance as any,
          feedback: feedback || null,
          score: score || null,
        };
        if (mode === 'online') {
          payload.meeting_link = meetingLink.trim();
          payload.location = null;
        } else {
          payload.location = location.trim();
          payload.meeting_link = null;
        }
        await updateMutation.mutateAsync({
          applicationUid,
          interviewUid: editingInterview.uid,
          payload,
        });
        Alert.alert('Success', 'Interview updated successfully.');
      } else {
        const payload: CreateInterviewPayload = {
          stage_uid: selectedStageUid,
          scheduled_at: scheduledAt,
          mode,
          attendance: 'scheduled',
        };
        if (mode === 'online') {
          payload.meeting_link = meetingLink.trim();
        } else {
          payload.location = location.trim();
        }
        await createMutation.mutateAsync({ applicationUid, payload });
        Alert.alert('Success', 'Interview scheduled successfully.');
      }
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        data?.error ||
        data?.message ||
        (data && typeof data === 'object'
          ? Object.values(data).flat().join('\n')
          : null) ||
        `Failed to ${isEdit ? 'update' : 'schedule'} interview.`;
      Alert.alert('Error', String(msg));
    }
  };

  return (
    <Modal statusBarTranslucent navigationBarTranslucent visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView behavior="padding" style={styles.sheetWrapper}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name={isEdit ? "pencil-outline" : "calendar-outline"} size={20} color={colors.primary} />
              </View>
              <AppText variant="h3" style={styles.headerTitle}>
                {isEdit ? 'Edit Interview' : 'Schedule Interview'}
              </AppText>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn} disabled={mutation.isPending}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {/* Stage Selector */}
            <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
              Stage *
            </AppText>
            <Pressable style={styles.stageSelector} onPress={() => { setStagePickerOpen(!stagePickerOpen); setAttendancePickerOpen(false); }}>
              {selectedStage ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.stageDot, { backgroundColor: getStageColor(selectedStage.code, colors) }]} />
                  <AppText variant="body" style={{ fontWeight: '600', marginLeft: spacing.sm }}>
                    {selectedStage.name}
                  </AppText>
                </View>
              ) : (
                <AppText variant="body" color={colors.textMuted}>Select a stage</AppText>
              )}
              <Ionicons name={stagePickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </Pressable>
            {stagePickerOpen && sortedStages.length > 0 && (
              <View style={styles.dropdownList}>
                {sortedStages.map((stage) => {
                  const isSel = stage.uid === selectedStageUid;
                  const sc = getStageColor(stage.code, colors);
                  return (
                    <Pressable
                      key={stage.uid}
                      style={[styles.dropdownOption, isSel && { backgroundColor: sc + '10' }]}
                      onPress={() => { setSelectedStageUid(stage.uid); setStagePickerOpen(false); }}
                    >
                      <View style={[styles.stageDot, { backgroundColor: sc }]} />
                      <AppText variant="body" style={{ fontWeight: isSel ? '700' : '500', flex: 1 }}>
                        {stage.name}
                      </AppText>
                      {isSel && <Ionicons name="checkmark-circle" size={18} color={sc} />}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Date & Time */}
            <AppDatePicker
              label="Date *"
              value={date}
              onChange={setDate}
              placeholder="Select interview date"
            />
            <AppDatePicker
              label="Time *"
              value={time}
              onChange={setTime}
              placeholder="Select interview time"
              mode="time"
            />

            {/* Mode Toggle */}
            <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
              Mode *
            </AppText>
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeBtn, mode === 'online' && styles.modeBtnActive]}
                onPress={() => setMode('online')}
              >
                <Ionicons name="videocam-outline" size={18} color={mode === 'online' ? colors.primary : colors.textMuted} />
                <AppText variant="body" style={{ fontWeight: '600', marginLeft: spacing.sm, color: mode === 'online' ? colors.primary : colors.textSecondary }}>
                  Online
                </AppText>
              </Pressable>
              <Pressable
                style={[styles.modeBtn, mode === 'offline' && styles.modeBtnActive]}
                onPress={() => setMode('offline')}
              >
                <Ionicons name="location-outline" size={18} color={mode === 'offline' ? colors.primary : colors.textMuted} />
                <AppText variant="body" style={{ fontWeight: '600', marginLeft: spacing.sm, color: mode === 'offline' ? colors.primary : colors.textSecondary }}>
                  Offline
                </AppText>
              </Pressable>
            </View>

            {/* Conditional Fields */}
            {mode === 'online' ? (
              <AppInput
                label="Meeting Link *"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChangeText={setMeetingLink}
              />
            ) : (
              <AppInput
                label="Location *"
                placeholder="e.g. Conference Room B"
                value={location}
                onChangeText={setLocation}
              />
            )}

            {/* Edit-only fields */}
            {isEdit ? (
              <>
                {/* Attendance */}
                <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                  Attendance
                </AppText>
                <Pressable style={styles.stageSelector} onPress={() => { setAttendancePickerOpen(!attendancePickerOpen); setStagePickerOpen(false); }}>
                  <AppText variant="body" style={{ fontWeight: '600' }}>
                    {ATTENDANCE_OPTIONS.find(o => o.value === attendance)?.label || 'Scheduled'}
                  </AppText>
                  <Ionicons name={attendancePickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </Pressable>
                {attendancePickerOpen && (
                  <View style={styles.dropdownList}>
                    {ATTENDANCE_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        style={[styles.dropdownOption, attendance === opt.value && { backgroundColor: colors.primaryLight + '10' }]}
                        onPress={() => { setAttendance(opt.value); setAttendancePickerOpen(false); }}
                      >
                        <AppText variant="body" style={{ fontWeight: attendance === opt.value ? '700' : '500', flex: 1 }}>
                          {opt.label}
                        </AppText>
                        {attendance === opt.value && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                      </Pressable>
                    ))}
                  </View>
                )}

                <AppInput
                  label="Feedback"
                  placeholder="Interview feedback..."
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                  numberOfLines={3}
                />
                <AppInput
                  label="Score"
                  placeholder="e.g. 85"
                  value={score}
                  onChangeText={setScore}
                  keyboardType="numeric"
                />
              </>
            ) : null}

            <AppButton
              title={isEdit ? 'Update Interview' : 'Schedule Interview'}
              onPress={handleSubmit}
              loading={mutation.isPending}
              style={styles.submitBtn}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  fieldLabel: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  stageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    height: 46,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  dropdownList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '12',
  },
  submitBtn: {
    marginTop: spacing.md,
    height: 54,
    borderRadius: 16,
  },
});
