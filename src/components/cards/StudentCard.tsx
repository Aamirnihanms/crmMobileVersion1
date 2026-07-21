import { useAppTheme, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';

const StudentCard = memo(({ student, onPress }: any) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const batch = student.batches?.[0]; // show latest batch

  return (
    <Pressable onPress={onPress}>
      <AppCard style={styles.card}>
        <View style={styles.header}>
          {student.profile_pic ? (
            <Image
              source={{ uri: student.profile_pic }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <AppText variant="subtitle" color={colors.primary}>
                {student.full_name?.charAt(0) || '?'}
              </AppText>
            </View>
          )}
          <View style={styles.headerContent}>
            <View style={styles.rowBetween}>
              <AppText variant="subtitle" style={styles.name}>
                {student.full_name}
              </AppText>
            </View>
            {batch?.course && (
              <AppText variant="caption" color={colors.primary} style={styles.course}>
                {batch.course}
              </AppText>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.infoText}>
              {student.location}
            </AppText>
          </View>
          {batch?.attendance_mode?.name && (
            <View style={styles.infoItem}>
              <Ionicons name="headset-outline" size={14} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary} style={styles.infoText}>
                {batch.attendance_mode.name}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {batch?.enrollment_status && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: batch.enrollment_status.color + '20' },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: batch.enrollment_status.color }]} />
              <AppText
                variant="caption"
                style={[styles.statusText, { color: batch.enrollment_status.color }]}
              >
                {batch.enrollment_status.name}
              </AppText>
            </View>
          )}

          {batch?.admission_counsellor && (
            <View style={styles.counsellorRow}>
              <Ionicons name="person-circle-outline" size={16} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textMuted} style={styles.counsellorText}>
                {batch.admission_counsellor}
              </AppText>
            </View>
          )}
        </View>
      </AppCard>
    </Pressable>
  );
}, (prev, next) => {
  return (
    prev.student.uid === next.student.uid &&
    prev.student.full_name === next.student.full_name &&
    prev.student.student_id === next.student.student_id &&
    prev.student.location === next.student.location &&
    prev.student.profile_pic === next.student.profile_pic &&
    prev.student.is_active === next.student.is_active &&
    JSON.stringify(prev.student.batches?.[0]) === JSON.stringify(next.student.batches?.[0])
  );
});

StudentCard.displayName = 'StudentCard';

export default StudentCard;

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
  },
  course: {
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
    opacity: 0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 11,
  },
  counsellorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counsellorText: {
    marginLeft: 4,
    fontSize: 11,
  },
});
