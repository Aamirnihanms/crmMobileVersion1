import {
  fetchCoursesPage,
  fetchQualificationsPage,
} from '@/src/api/masters/paginatedMasters.api';
import { Course } from '@/src/types/course';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/src/theme';
import AppCard from './../common/AppCard';
import AppSelect from './../common/AppSelect';
import AppText from './../common/AppText';

type Props = {
  form: any;
  setForm: (data: any) => void;
  initialCourseDetails?: Course | null;
  initialEducationOption?: {
    label: string;
    value: number;
  } | null;
};

export default function LeadCourseSection({
  form,
  setForm,
  initialCourseDetails,
  initialEducationOption,
}: Props) {
  const [courseMap, setCourseMap] = React.useState<Record<number, Course>>({});

  React.useEffect(() => {
    if (!initialCourseDetails?.id) return;
    setCourseMap((prev) => ({
      ...prev,
      [initialCourseDetails.id]: initialCourseDetails,
    }));
  }, [initialCourseDetails]);

  const fetchCourseOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchCoursesPage({ page, pageSize, search });

      setCourseMap((prev) => {
        const next = { ...prev };
        result.items.forEach((item) => {
          next[item.id] = item;
        });
        return next;
      });

      return {
        options: result.items.map((item) => ({
          label: item.course_name,
          value: item.id,
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const fetchQualificationOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchQualificationsPage({ page, pageSize, search });
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

  const selectedCourse = form.course
    ? courseMap[Number(form.course)]
    : undefined;

  const courseModes =
    selectedCourse?.course_mode_details.map((m: any) => ({
      label: m.name,
      value: m.id,
    })) ?? [];

  const locations =
    selectedCourse?.location_details.map((l: any) => ({
      label: l.name,
      value: l.id,
    })) ?? [];

  const passOutYears = Array.from(
    { length: new Date().getFullYear() - 1990 + 6 },
    (_, i) => {
      const year = 1990 + i;
      return { label: String(year), value: String(year) };
    }
  );

  const selectedCourseOption = selectedCourse
    ? [{ label: selectedCourse.course_name, value: selectedCourse.id }]
    : [];

  const selectedEducationOption =
    initialEducationOption &&
      String(initialEducationOption.value) === String(form.education_level)
      ? [initialEducationOption]
      : [];

  return (
    <View style={styles.container}>
      <AppText variant="h3" style={styles.title}>Academic & Course</AppText>

      <AppCard style={styles.card}>
        <AppSelect
          label="Education Level"
          value={form.education_level}
          options={selectedEducationOption}
          fetchOptions={fetchQualificationOptions}
          queryKey={['lead-form', 'qualifications']}
          onSelect={(v) =>
            setForm({ ...form, education_level: v })
          }
        />

        <AppSelect
          label="Pass Out Year"
          value={form.pass_out_year}
          options={passOutYears}
          onSelect={(v) =>
            setForm({ ...form, pass_out_year: v })
          }
        />

        <AppSelect
          label="Course"
          value={form.course}
          options={selectedCourseOption}
          fetchOptions={fetchCourseOptions}
          queryKey={['lead-form', 'courses']}
          onSelect={(v) =>
            setForm({
              ...form,
              course: v,
              course_mode: undefined,
              preferred_location: undefined,
            })
          }
        />

        {form.course && (
          <>
            <AppSelect
              label="Course Mode"
              value={form.course_mode}
              options={courseModes}
              onSelect={(v) =>
                setForm({ ...form, course_mode: v })
              }
            />

            <AppSelect
              label="Preferred Location"
              value={form.preferred_location}
              options={locations}
              onSelect={(v) =>
                setForm({
                  ...form,
                  preferred_location: v,
                })
              }
            />
          </>
        )}
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
    paddingBottom: spacing.sm,
  },
});
