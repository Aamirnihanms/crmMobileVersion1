import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import AppText from '../common/AppText';
import { spacing, colors } from '../../theme';

type Importance = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export default function AddFollowUpModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    notes: string;
    next_follow_up_date: string;
    importance: Importance;
  }) => void;
}) {
  const [notes, setNotes] = React.useState('');
  const [importance, setImportance] =
    React.useState<Importance>('NORMAL');
const [date, setDate] = React.useState(new Date());
const [showDatePicker, setShowDatePicker] = React.useState(false);
const [showTimePicker, setShowTimePicker] = React.useState(false);


  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <AppText variant="subtitle">Add Follow-up</AppText>

          {/* NOTES */}
          <TextInput
            placeholder="Enter notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={styles.input}
          />

          {/* DATE PICKER */}
<AppText style={styles.label}>Follow-up Date</AppText>

<Pressable
  style={styles.dateButton}
  onPress={() => setShowDatePicker(true)}
>
  <AppText>{date.toLocaleString()}</AppText>
</Pressable>

{/* DATE PICKER */}
{showDatePicker && (
  <DateTimePicker
    value={date}
    mode="date"
    display="default"
    onChange={(_, selectedDate) => {
      setShowDatePicker(false);
      if (selectedDate) {
        setDate((prev) => {
          const newDate = new Date(prev);
          newDate.setFullYear(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          );
          return newDate;
        });

        // after date → open time picker
        setShowTimePicker(true);
      }
    }}
  />
)}

{/* TIME PICKER */}
{showTimePicker && (
  <DateTimePicker
    value={date}
    mode="time"
    display="default"
    onChange={(_, selectedTime) => {
      setShowTimePicker(false);
      if (selectedTime) {
        setDate((prev) => {
          const newDate = new Date(prev);
          newDate.setHours(
            selectedTime.getHours(),
            selectedTime.getMinutes()
          );
          return newDate;
        });
      }
    }}
  />
)}


          {/* IMPORTANCE */}
          <AppText style={styles.label}>Importance</AppText>

          <View style={styles.importanceRow}>
            {(['NORMAL', 'IMPORTANT', 'URGENT'] as Importance[]).map(
              (level) => (
                <Pressable
                  key={level}
                  onPress={() => setImportance(level)}
                  style={[
                    styles.chip,
                    importance === level &&
                      styles.chipActive,
                  ]}
                >
                  <AppText
                    style={
                      importance === level
                        ? styles.chipTextActive
                        : undefined
                    }
                  >
                    {level}
                  </AppText>
                </Pressable>
              )
            )}
          </View>

          {/* ACTIONS */}
          <View style={styles.actions}>
            <Pressable onPress={onClose}>
              <AppText>Cancel</AppText>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!notes.trim()) return;

                onSubmit({
                  notes,
                  importance,
                  next_follow_up_date: date.toISOString(),
                });

                setNotes('');
                setImportance('NORMAL');
                setDate(new Date());
              }}
            >
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  importanceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTextActive: {
    color: 'white',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  dateButton: {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.md,
  marginTop: spacing.sm,
},

});
