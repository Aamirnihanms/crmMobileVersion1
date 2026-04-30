import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '@/src/theme';
import AppText from './AppText';

type AppDatePickerProps = {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  minimumDate?: Date;
  maximumDate?: Date;
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
}: AppDatePickerProps) {
  const [show, setShow] = useState(false);

  // Parse YYYY-MM-DD string to Date object
  const dateValue = value ? new Date(value) : new Date();

  const handlePress = () => {
    setShow(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // iOS keeps the picker open until dismissed

    if (event.type === 'set' && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      onChange(dateString);
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
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
          <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
        </View>
      </Pressable>

      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
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
});
