import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import AppSelect from './../common/AppSelect';
import AppText from './../common/AppText';
import { spacing, colors } from '../../theme';
import { Qualification } from '@/src/types/qualification';

type Props = {
  form: any;
  setForm: (data: any) => void;
  counselors: any[];
  sources: any[];
  statuses: any[];
  qualifications: Qualification[]; // ✅ ADD THIS
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
      <AppText variant="subtitle">
        Additional Details
      </AppText>

      <AppSelect
        label="Counselor"
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
        label="Lead Status"
        value={form.lead_status}
        options={statuses.map((s) => ({
          label: s.name,
          value: s.id,
        }))}
        onSelect={(v) =>
          setForm({ ...form, lead_status: v })
        }
      />

      <TextInput
        placeholder="Reminder Date (YYYY-MM-DD)"
        value={form.reminder_date}
        onChangeText={(v) =>
          setForm({ ...form, reminder_date: v })
        }
        style={styles.input}
      />

      <TextInput
        placeholder="Notes"
        multiline
        value={form.notes}
        onChangeText={(v) =>
          setForm({ ...form, notes: v })
        }
        style={[styles.input, { height: 80 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
});
