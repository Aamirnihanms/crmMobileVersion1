import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';

export default function StudentEnrollmentsSection({
  enrollments,
}: any) {
  if (!enrollments?.length) return null;

  const navigation =
    useNavigation<
      NativeStackNavigationProp<StudentsStackParamList>
    >();

  const handlePress = (e: any) => {
    navigation.navigate('EnrollmentDetails', {
      id: e.uid,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <AppText variant="h3" style={styles.sectionTitle}>Enrollments</AppText>
        <AppText variant="caption" color={colors.textMuted}>Current and past courses</AppText>
      </View>

      {enrollments.map((e: any) => (
        <Pressable key={e.uid} onPress={() => handlePress(e)}>
          <AppCard style={styles.enrollmentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="book-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <AppText variant="subtitle" style={styles.courseName}>
                  {e.batch?.course_name || 'N/A'}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.batchName}>
                  {e.batch?.batch_name || 'No Batch Assigned'}
                </AppText>
              </View>
              <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
              <View style={[styles.statusBadge, { backgroundColor: (e.status_object?.color || colors.primary) + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: e.status_object?.color || colors.primary }]} />
                <AppText variant="caption" style={[styles.statusText, { color: e.status_object?.color || colors.primary }]}>
                  {e.status_object?.name || 'Active'}
                </AppText>
              </View>

              <View style={styles.codeContainer}>
                <Ionicons name="barcode-outline" size={12} color={colors.textMuted} />
                <AppText variant="caption" color={colors.textMuted} style={styles.codeText}>
                  {e.batch?.batch_code || 'N/A'}
                </AppText>
              </View>
            </View>
          </AppCard>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  enrollmentCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  courseName: {
    fontWeight: '800',
    color: colors.textPrimary,
    fontSize: 16,
  },
  batchName: {
    fontWeight: '500',
    marginTop: 2,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceSubtle,
    marginVertical: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
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
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    marginLeft: 4,
    fontWeight: '600',
  },
});