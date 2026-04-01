import {
  fetchCounselorsPage,
  fetchLeadSourcesPage,
  fetchLeadStatusesPage,
} from '@/src/api/masters/paginatedMasters.api';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/src/theme';
import AppCard from './../common/AppCard';
import AppInput from './../common/AppInput';
import AppSelect from './../common/AppSelect';
import AppText from './../common/AppText';

type FallbackOption = {
  label: string;
  value: string | number;
};

type Props = {
  form: any;
  setForm: (data: any) => void;
  initialCounselorOption?: FallbackOption | null;
  initialSourceOption?: FallbackOption | null;
  initialStatusOption?: FallbackOption | null;
};

export default function LeadAdditionalSection({
  form,
  setForm,
  initialCounselorOption,
  initialSourceOption,
  initialStatusOption,
}: Props) {
  const fetchCounselorOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchCounselorsPage({ page, pageSize, search });
      return {
        options: result.items.map((item) => ({
          label: item.full_name,
          value: item.id,
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const fetchLeadSourceOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchLeadSourcesPage({ page, pageSize, search });
      return {
        options: result.items.map((item) => ({
          label: item.label,
          value: item.id,
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const fetchLeadStatusOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchLeadStatusesPage({ page, pageSize, search });
      return {
        options: result.items.map((item) => ({
          label: item.name,
          value: item.id,
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const counselorFallback =
    initialCounselorOption &&
      String(initialCounselorOption.value) === String(form.counselor)
      ? [initialCounselorOption]
      : [];

  const sourceFallback =
    initialSourceOption &&
      String(initialSourceOption.value) === String(form.lead_source)
      ? [initialSourceOption]
      : [];

  const statusFallback =
    initialStatusOption &&
      String(initialStatusOption.value) === String(form.lead_status)
      ? [initialStatusOption]
      : [];

  return (
    <View style={styles.container}>
      <AppText variant="h3" style={styles.title}>System & Strategy</AppText>

      <AppCard style={styles.card}>
        <AppSelect
          label="Assigned Counselor"
          value={form.counselor}
          options={counselorFallback}
          fetchOptions={fetchCounselorOptions}
          queryKey={['lead-form', 'counselors']}
          onSelect={(v) =>
            setForm({ ...form, counselor: v })
          }
        />

        <AppSelect
          label="Lead Source"
          value={form.lead_source}
          options={sourceFallback}
          fetchOptions={fetchLeadSourceOptions}
          queryKey={['lead-form', 'sources']}
          onSelect={(v) =>
            setForm({ ...form, lead_source: v })
          }
        />

        <AppSelect
          label="Current Status"
          value={form.lead_status}
          options={statusFallback}
          fetchOptions={fetchLeadStatusOptions}
          queryKey={['lead-form', 'statuses']}
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
