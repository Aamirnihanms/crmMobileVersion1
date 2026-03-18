import { Pressable, View, StyleSheet } from 'react-native';
import AppText from '../common/AppText';
import { colors, spacing } from '@/src/theme';

export default function StudentCard({ student, onPress }: any) {
  const batch = student.batches?.[0]; // show latest batch

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* NAME + ID */}
      <View style={styles.rowBetween}>
        <AppText variant="subtitle">
          {student.full_name}
        </AppText>

        <AppText variant="caption" color={colors.textSecondary}>
          {student.student_id}
        </AppText>
      </View>

      {/* COURSE */}
      {batch?.course && (
        <AppText style={styles.course}>
          {batch.course}
        </AppText>
      )}

      {/* INFO ROW */}
      <View style={styles.metaRow}>
        <AppText variant="caption">
          📍 {student.location}
        </AppText>

        {batch?.attendance_mode?.name && (
          <AppText variant="caption">
            🎧 {batch.attendance_mode.name}
          </AppText>
        )}
      </View>

      {/* STATUS BADGE */}
      {batch?.enrollment_status && (
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: batch.enrollment_status.color },
          ]}
        >
          <AppText style={styles.statusText}>
            {batch.enrollment_status.name}
          </AppText>
        </View>
      )}

      {/* COUNSELLOR */}
      {batch?.admission_counsellor && (
        <AppText variant="caption" color={colors.textSecondary}>
          👤 {batch.admission_counsellor}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 1,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  course: {
    marginTop: spacing.xs,
    fontWeight: '600',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },

  statusText: {
    color: '#fff',
    fontSize: 12,
  },
});