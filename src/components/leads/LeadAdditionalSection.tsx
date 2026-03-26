import { Qualification } from '@/src/types/qualification';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/src/theme';
import AppCard from './../common/AppCard';
import AppInput from './../common/AppInput';
import AppSelect from './../common/AppSelect';
import AppText from './../common/AppText';

type Props = {
  form: any;
  setForm: (data: any) => void;
  counselors: any[];
  sources: any[];
  statuses: any[];
  qualifications: Qualification[];
  passOutYears: number[];
};

export default function LeadAdditionalSection({
  form,
  setForm,
  counselors,
  sources,
  statuses,
}: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="h3" style={styles.title}>System & Strategy</AppText>

      <AppCard style={styles.card}>
        <AppSelect
          label="Assigned Counselor"
          value={form.counselor}
          options={counselors.map((c) => ({
            label: c.full_name,
            value: c.id,
          }))}
          onSelect={(v) =>
            setForm({ ...form, counselor: v })
          }
        />

        <AppSelect
          label="Lead Source"
          value={form.lead_source}
          options={sources.map((s) => ({
            label: s.label,
            value: s.id,
          }))}
          onSelect={(v) =>
            setForm({ ...form, lead_source: v })
          }
        />

        <AppSelect
          label="Current Status"
          value={form.lead_status}
          options={statuses.map((s) => ({
            label: s.name,
            value: s.id,
          }))}
          onSelect={(v) =>
            setForm({ ...form, lead_status: v })
          }
        />

        <AppInput
          label="Reminder Date"
          placeholder="YYYY-MM-DD"
          value={form.reminder_date}
          onChangeText={(v) =>
            setForm({ ...form, reminder_date: v })
          }
          containerStyle={styles.inputContainer}
        />

        <AppInput
          label="Internal Notes"
          placeholder="Add any additional context here..."
          multiline
          value={form.notes}
          onChangeText={(v) =>
            setForm({ ...form, notes: v })
          }
          style={{ height: 100, textAlignVertical: 'top' }}
          containerStyle={{ marginBottom: 0 }}
        />
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  card: {
    padding: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
});
