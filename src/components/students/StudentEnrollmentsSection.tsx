import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { useToggleEnrollmentAccess } from '@/src/queries/enrollment.query';
import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';

export default function StudentEnrollmentsSection({
  enrollments,
  studentId,
}: { enrollments: any[], studentId: string }) {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<StudentsStackParamList>
    >();

  const toggleMutation = useToggleEnrollmentAccess();

  if (!enrollments?.length) return null;

  const handlePress = (e: any) => {
    navigation.navigate('EnrollmentDetails', {
      id: e.uid,
      studentId: studentId,
    });
  };

  const handleBatchChange = (e: any) => {
    navigation.navigate('BatchChange', {
      enrollmentId: e.uid,
      studentId: studentId,
    });
  };

  const handleToggleAccess = (enrollmentNumber: string, currentActive: boolean) => {
    const willActivate = !currentActive;
    const actionLabel = willActivate ? 'Enable' : 'Disable';
    const actionDesc = willActivate
      ? 'This will grant CRM access to this enrollment.'
      : 'This will revoke CRM access for this enrollment.';

    Alert.alert(
      `${actionLabel} Enrollment Access`,
      actionDesc,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: willActivate ? 'default' : 'destructive',
          onPress: () => {
            toggleMutation.mutate({ id: enrollmentNumber, is_active: willActivate });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <AppText variant="h3" style={styles.sectionTitle}>Enrollments</AppText>
        <AppText variant="caption" color={colors.textMuted}>Current and past courses</AppText>
      </View>

      {enrollments.map((e: any) => {
        const crmActive = e.crm_access_enabled ?? false;
        const isToggling = toggleMutation.isPending && toggleMutation.variables?.id === e.enrollment_number;

        return (
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
                <View style={styles.toggleContainer}>
                  {isToggling ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Switch
                      value={crmActive}
                      onValueChange={() => handleToggleAccess(e.enrollment_number, crmActive)}
                      trackColor={{ false: colors.danger + '50', true: colors.success + '50' }}
                      thumbColor={crmActive ? colors.success : colors.danger}
                      style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }}
                    />
                  )}
                  <AppText
                    style={[
                      styles.toggleLabel,
                      { color: crmActive ? colors.successStrong : colors.dangerStrong },
                    ]}
                  >
                    {crmActive ? 'Active' : 'Inactive'}
                  </AppText>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  <View style={[styles.statusBadge, { backgroundColor: (e.status_object?.color || colors.primary) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: e.status_object?.color || colors.primary }]} />
                    <AppText variant="caption" style={[styles.statusText, { color: e.status_object?.color || colors.primary }]}>
                      {e.status_object?.name || 'Active'}
                    </AppText>
                  </View>
                </View>

                {e.status_object?.value !== 'removed' && e.status_object?.value !== 'dropped' && (
                  <TouchableOpacity
                    style={styles.batchChangeBtn}
                    onPress={(ev) => {
                      ev.stopPropagation();
                      handleBatchChange(e);
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="swap-horizontal-outline" size={13} color={colors.primary} />
                    <AppText variant="caption" style={styles.batchChangeBtnText}>
                      Batch Change
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            </AppCard>
          </Pressable>
        );
      })}
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
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleContainer: {
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 4,
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
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
  batchChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '0D',
  },
  batchChangeBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  accessText: {
    fontWeight: '700',
    fontSize: 10,
  },
});
