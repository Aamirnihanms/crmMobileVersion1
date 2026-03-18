import { View, StyleSheet } from 'react-native';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';

export default function StudentHeader({ student }: any) {
  return (
    <View style={styles.card}>
      <AppText variant="title">
        {student.full_name}
      </AppText>

      <AppText color={colors.textSecondary}>
        {student.student_id}
      </AppText>

      <View style={styles.row}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: student.status?.color },
          ]}
        >
          <AppText style={{ color: '#fff' }}>
            {student.status?.name}
          </AppText>
        </View>
      </View>

      {student.admission_counselor && (
        <AppText variant="caption">
          👤 {student.admission_counselor.full_name}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  row: {
    marginVertical: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
});