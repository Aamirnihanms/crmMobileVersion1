import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './../common/AppText';
import AppSelect from './../common/AppSelect';
import { spacing } from '../../theme';
import { Course } from '@/src/types/course';
import { generatePassOutYears } from '@/src/utils/passOutYears';

type Props = {
  form: any;
  setForm: (data: any) => void;
  courses: any[];
  qualifications: any[];
  selectedCourse?: Course; 
};

export default function LeadCourseSection({
  form,
  setForm,
  courses,
  qualifications,
}: Props) {
  const selectedCourse = courses?.find(
    (c) => c.id === form.course
  );

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

  return (
    <View style={styles.container}>
      <AppText variant="subtitle">
        Academic Details
      </AppText>

      <AppSelect
        label="Education Level"
        value={form.education_level}
        options={qualifications.map((q) => ({
          label: q.name,
          value: q.id,
        }))}
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
        options={courses.map((c) => ({
          label: c.course_name,
          value: c.id,
        }))}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
});
