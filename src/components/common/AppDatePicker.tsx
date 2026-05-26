import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle, Modal } from 'react-native';
import { colors, spacing } from '@/src/theme';
import AppText from './AppText';

type AppDatePickerProps = {
  label?: string;
  value: string; // YYYY-MM-DD or HH:mm
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'date' | 'time';
};

export default function AppDatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  containerStyle,
  minimumDate,
  maximumDate,
  mode = 'date',
}: AppDatePickerProps) {
  const [show, setShow] = useState(false);

  const parseDate = (val: string, m: 'date' | 'time') => {
    if (!val) return new Date();
    if (m === 'time') {
      const [hours, minutes] = val.split(':').map(Number);
      const d = new Date();
      d.setHours(hours || 0, minutes || 0, 0, 0);
      return d;
    }
    return new Date(val);
  };

  const dateValue = parseDate(value, mode);
  const [tempDate, setTempDate] = useState(dateValue);

  useEffect(() => {
    if (show && Platform.OS === 'ios') {
      setTempDate(parseDate(value, mode));
    }
  }, [show, value, mode]);

  const handlePress = () => {
    setShow(true);
  };

  const formatOutput = (d: Date) => {
    if (mode === 'time') {
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${mins}`;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    } else {
      setShow(false);
      if (event.type === 'set' && selectedDate) {
        onChange(formatOutput(selectedDate));
      }
    }
  };

  const confirmIosDate = () => {
    setShow(false);
    onChange(formatOutput(tempDate));
  };

  const cancelIosDate = () => {
    setShow(false);
  };

  const displayValue = value || '';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText
          variant="caption"
          color={colors.textSecondary}
          style={styles.label}
        >
          {label}
        </AppText>
      ) : null}

      <Pressable
        onPress={handlePress}
        style={[
          styles.inputWrapper,
          error && styles.errorBorder,
        ]}
      >
        <AppText
          style={[
            styles.inputText,
            !displayValue && styles.placeholderText,
          ]}
        >
          {displayValue || placeholder}
        </AppText>
        <View style={styles.rightElement}>
          <Ionicons name={mode === 'time' ? "time-outline" : "calendar-outline"} size={20} color={colors.textMuted} />
        </View>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide">
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <Pressable onPress={cancelIosDate} style={styles.iosHeaderBtn}>
                  <AppText color={colors.primary}>Cancel</AppText>
                </Pressable>
                <Pressable onPress={confirmIosDate} style={styles.iosHeaderBtn}>
                  <AppText style={{ fontWeight: 'bold' }} color={colors.primary}>Done</AppText>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                themeVariant="light"
                textColor="#000000"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={dateValue}
            mode={mode}
            display="default"
            onChange={handleDateChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )
      )}

      {error ? (
        <AppText
          variant="caption"
          color={colors.danger}
          style={styles.errorText}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    height: 46,
    paddingHorizontal: spacing.lg,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  rightElement: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  iosModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosPickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iosHeaderBtn: {
    padding: spacing.sm,
  },
});
