import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme, spacing } from '@/src/theme';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';
import ScheduleInterviewModal from '../../components/jobs/ScheduleInterviewModal';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import { useDeleteInterview, useInterviewDetail } from '../../queries/jobs.query';

type InterviewDetailRouteProp = RouteProp<MoreStackParamList, 'InterviewDetail'>;

function getAttendanceColor(attendance: string, colors: any): string {
  const ATTENDANCE_COLORS: Record<string, string> = {
    scheduled: colors.warning,
    present: colors.success,
    absent: colors.danger,
    rescheduled: colors.info,
  };
  return ATTENDANCE_COLORS[attendance?.toLowerCase()] || colors.textMuted;
}

function SectionHeader({ title }: { title: string }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="subtitle" style={{ fontWeight: '700', color: colors.textPrimary }}>
        {title}
      </AppText>
      <View style={styles.sectionDivider} />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
      <AppText variant="caption" color={colors.textMuted} style={{ width: 80 }}>
        {label}
      </AppText>
      <AppText variant="body" style={{ flex: 1, fontWeight: '500' }} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InterviewDetailScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const route = useRoute<InterviewDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { companyUid, jobUid, applicationUid, interviewUid, applicantName } = route.params;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<any>(null);

  const deleteInterviewMutation = useDeleteInterview(companyUid, jobUid);

  const { data, isLoading, isError, error, refetch } = useInterviewDetail(
    companyUid,
    jobUid,
    applicationUid,
    interviewUid
  );

  if (isLoading) return <AppLoader />;

  if (isError) {
    const errDetail =
      (error as any)?.response?.data?.detail ||
      (error as any)?.response?.data?.error ||
      (error as Error)?.message ||
      'Failed to load interview details';
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={{ marginTop: spacing.md, textAlign: 'center', fontWeight: '600' }}>
          {errDetail}
        </AppText>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

  const interview = data?.interview || data || ({} as any);
  const name = applicantName || interview.applicant_name || 'Unknown';
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const attendanceColor = getAttendanceColor(interview.attendance, colors);
  const attendance = interview.attendance || 'scheduled';
  const isOnline = interview.mode === 'online';

  const handleDelete = () => {
    Alert.alert(
      'Delete Interview',
      'Are you sure you want to delete this interview?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteInterviewMutation.mutate(
              { applicationUid, interviewUid },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'Interview deleted successfully.');
                },
                onError: (err: any) => {
                  const data = err?.response?.data;
                  Alert.alert(
                    'Error',
                    data?.detail || data?.error || data?.message || 'Failed to delete interview.'
                  );
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setEditingInterview({ ...interview });
    setShowEditModal(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top > 0 ? 0 : spacing.sm }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: attendanceColor + '20' }]}>
              <AppText style={{ color: attendanceColor, fontWeight: '800', fontSize: 22 }}>
                {initial}
              </AppText>
            </View>
            <View style={styles.profileInfo}>
              <AppText variant="title" style={{ fontWeight: '700' }} numberOfLines={1}>
                {name}
              </AppText>
              <View style={styles.badgeRow}>
                <View style={[styles.attendanceBadge, { backgroundColor: attendanceColor + '15' }]}>
                  <AppText variant="caption" style={{ color: attendanceColor, fontWeight: '700', fontSize: 11 }}>
                    {attendance}
                  </AppText>
                </View>
                {interview.stage_name ? (
                  <View style={[styles.stageBadge, { backgroundColor: colors.primaryLight + '15' }]}>
                    <AppText variant="caption" style={{ color: colors.primary, fontWeight: '600', fontSize: 11 }}>
                      {interview.stage_name}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <View style={styles.contactRow}>
                {interview.applicant_phone ? (
                  <Pressable style={styles.contactChip} onPress={() => Linking.openURL(`tel:${interview.applicant_phone}`)}>
                    <Ionicons name="call-outline" size={12} color={colors.success} />
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }} numberOfLines={1}>
                      {interview.applicant_phone}
                    </AppText>
                  </Pressable>
                ) : null}
                {interview.applicant_email ? (
                  <Pressable style={styles.contactChip} onPress={() => Linking.openURL(`mailto:${interview.applicant_email}`)}>
                    <Ionicons name="mail-outline" size={12} color={colors.info} />
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }} numberOfLines={1}>
                      {interview.applicant_email}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.editBtn} onPress={handleEdit}>
            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            <AppText style={{ color: colors.primary, fontWeight: '700', marginLeft: spacing.sm }}>
              Edit Interview
            </AppText>
          </Pressable>
          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <AppText style={{ color: colors.danger, fontWeight: '700', marginLeft: spacing.sm }}>
              Delete
            </AppText>
          </Pressable>
        </View>

        {/* Interview Info */}
        <View style={styles.sectionCard}>
          <SectionHeader title="Interview Details" />
          {interview.scheduled_at ? (
            <InfoRow icon="calendar-outline" label="Date" value={formatDate(interview.scheduled_at)} />
          ) : null}
          <InfoRow
            icon={isOnline ? 'videocam-outline' : 'location-outline'}
            label="Mode"
            value={isOnline ? 'Online' : 'Offline'}
          />
          {interview.meeting_link ? (
            <Pressable onPress={() => Linking.openURL(interview.meeting_link!)} style={styles.linkRow}>
              <Ionicons name="link-outline" size={16} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <AppText variant="caption" color={colors.primary} style={{ textDecorationLine: 'underline' }} numberOfLines={1}>
                {interview.meeting_link}
              </AppText>
            </Pressable>
          ) : null}
          {interview.location ? (
            <InfoRow icon="location-outline" label="Location" value={interview.location} />
          ) : null}
          {interview.applicant_type ? (
            <InfoRow icon="person-outline" label="Type" value={interview.applicant_type} />
          ) : null}
          {interview.student_id ? (
            <InfoRow icon="id-card-outline" label="Student ID" value={interview.student_id} />
          ) : null}
        </View>

        {/* Feedback */}
        {interview.feedback || interview.score != null ? (
          <View style={styles.sectionCard}>
            <SectionHeader title="Feedback" />
            {interview.score != null ? (
              <View style={styles.scoreRow}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <AppText variant="body" style={{ color: colors.warning, fontWeight: '700', marginLeft: spacing.sm }}>
                  {interview.score}
                </AppText>
              </View>
            ) : null}
            {interview.feedback ? (
              <View style={styles.feedbackBox}>
                <AppText variant="body" color={colors.textSecondary}>
                  {interview.feedback}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Footer */}
        {interview.created_at || interview.updated_at ? (
          <View style={styles.footer}>
            {interview.created_at ? (
              <AppText variant="caption" color={colors.textMuted}>
                Created: {formatDate(interview.created_at)}
              </AppText>
            ) : null}
            {interview.updated_at ? (
              <AppText variant="caption" color={colors.textMuted}>
                Updated: {formatDate(interview.updated_at)}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <ScheduleInterviewModal
        visible={showEditModal}
        companyUid={companyUid}
        jobUid={jobUid}
        applicationUid={applicationUid}
        editingInterview={editingInterview}
        onClose={() => {
          setShowEditModal(false);
          setEditingInterview(null);
        }}
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  attendanceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight + '15',
    paddingVertical: spacing.md,
    borderRadius: 14,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerBg,
    paddingVertical: spacing.md,
    borderRadius: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  feedbackBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryLight,
  },
  footer: {
    paddingVertical: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
});
