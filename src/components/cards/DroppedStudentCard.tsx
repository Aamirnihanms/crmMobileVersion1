import { DroppedStudent } from '@/src/api/students.api';
import { useAppTheme, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';
import AppButton from '../common/AppButton';

type DroppedStudentCardProps = {
  student: DroppedStudent;
  onPress: () => void;
};

const DroppedStudentCard = memo(({ student, onPress }: DroppedStudentCardProps) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const latestDrop = student.dropped_enrollments?.[0];

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
              <AppText variant="caption" color={colors.textMuted}>
                {student.student_id}
              </AppText>
            </View>
            {latestDrop?.batch?.course && (
              <AppText variant="caption" color={colors.primary} style={styles.course} numberOfLines={1}>
                {latestDrop.batch.course}
              </AppText>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.infoText}>
              {student.phone}
            </AppText>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.infoText}>
              {student.preferred_location}
            </AppText>
          </View>
          {latestDrop?.batch?.name && (
            <View style={styles.infoItem}>
              <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary} style={styles.infoText} numberOfLines={1}>
                {latestDrop.batch.name}
              </AppText>
            </View>
          )}
        </View>

        {latestDrop?.drop_notes ? (
           <View style={styles.notesContainer}>
             <AppText variant="caption" color={colors.textMuted} numberOfLines={2} style={styles.notesText}>
               Note: {latestDrop.drop_notes}
             </AppText>
           </View>
        ) : null}

        <View style={styles.footer}>
          <View style={[styles.statusBadge, { backgroundColor: colors.danger + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.danger }]} />
            <AppText variant="caption" style={[styles.statusText, { color: colors.danger }]}>
              Dropped
            </AppText>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
});

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
    flex: 1,
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
    columnGap: spacing.md,
    rowGap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 4,
  },
  notesContainer: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  notesText: {
    fontStyle: 'italic',
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
});

export default DroppedStudentCard;
