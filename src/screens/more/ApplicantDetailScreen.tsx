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

import { colors, spacing } from '@/src/theme';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';
import ScheduleInterviewModal from '../../components/jobs/ScheduleInterviewModal';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import { useJobApplicationDetail, useJobStages, useDeleteInterview } from '../../queries/jobs.query';

type ApplicantDetailRouteProp = RouteProp<MoreStackParamList, 'ApplicantDetail'>;

const STAGE_COLORS: Record<string, string> = {
  applied: colors.info,
  screening: colors.warning,
  interview: '#7C3AED',
  offer: colors.success,
  rejected: colors.danger,
};

function getStageColor(code: string): string {
  return STAGE_COLORS[code] || colors.primary;
}

function SectionHeader({ title }: { title: string }) {
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
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ApplicantDetailScreen() {
  const route = useRoute<ApplicantDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { companyUid, jobUid, applicationUid } = route.params;

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<any>(null);

  const { data: stagesData } = useJobStages(companyUid, jobUid);
  const deleteInterviewMutation = useDeleteInterview(companyUid, jobUid);

  const { data, isLoading, isError, error, refetch } = useJobApplicationDetail(
    companyUid,
    jobUid,
    applicationUid
  );

  if (isLoading) return <AppLoader />;

  if (isError) {
    const errDetail =
      (error as any)?.response?.data?.detail ||
      (error as any)?.response?.data?.error ||
      (error as Error)?.message ||
      'Failed to load applicant details';
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

  if (!data?.application) return null;

  const app = data.application;
  const stageColor = getStageColor(app.current_stage.code);

  return (
    <View style={[styles.container, { paddingTop: insets.top > 0 ? 0 : spacing.sm }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: stageColor + '20' }]}>
              <AppText style={{ color: stageColor, fontWeight: '800', fontSize: 22 }}>
                {app.applicant_name.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.profileInfo}>
              <AppText variant="title" style={{ fontWeight: '700' }} numberOfLines={1}>
                {app.applicant_name}
              </AppText>
              <View style={styles.badgeRow}>
                <View style={[styles.stageBadge, { backgroundColor: stageColor + '15' }]}>
                  <View style={[styles.stageDot, { backgroundColor: stageColor }]} />
                  <AppText variant="caption" style={{ color: stageColor, fontWeight: '700', fontSize: 11 }}>
                    {app.current_stage.name}
                  </AppText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: app.status === 'active' ? colors.successBg : colors.dangerBg }]}>
                  <AppText variant="caption" style={{ color: app.status === 'active' ? colors.success : colors.danger, fontWeight: '600', fontSize: 11 }}>
                    {app.status}
                  </AppText>
                </View>
              </View>
              <View style={styles.contactRow}>
                <Pressable style={styles.contactChip} onPress={() => Linking.openURL(`tel:${app.applicant_phone}`)}>
                  <Ionicons name="call-outline" size={12} color={colors.success} />
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }} numberOfLines={1}>
                    {app.applicant_phone}
                  </AppText>
                </Pressable>
                <Pressable style={styles.contactChip} onPress={() => Linking.openURL(`mailto:${app.applicant_email}`)}>
                  <Ionicons name="mail-outline" size={12} color={colors.info} />
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }} numberOfLines={1}>
                    {app.applicant_email}
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Job Info */}
        <View style={styles.sectionCard}>
          <SectionHeader title="Job Information" />
          <InfoRow icon="briefcase-outline" label="Job Title" value={app.job_title} />
          <InfoRow icon="person-outline" label="Type" value={app.applicant_type} />
          {app.student_id ? (
            <InfoRow icon="id-card-outline" label="Student ID" value={app.student_id} />
          ) : null}
          <InfoRow icon="calendar-outline" label="Applied" value={formatDate(app.applied_at)} />
        </View>

        {/* Resume */}
        {app.resume_file ? (
          <View style={styles.sectionCard}>
            <SectionHeader title="Resume" />
            <Pressable style={styles.resumeBtn} onPress={() => Linking.openURL(app.resume_file!)}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <AppText variant="body" style={{ marginLeft: spacing.sm, color: colors.primary, fontWeight: '600' }}>
                View Resume
              </AppText>
              <Ionicons name="open-outline" size={16} color={colors.primary} style={{ marginLeft: 'auto' }} />
            </Pressable>
          </View>
        ) : null}

        {/* Custom Answers */}
        {app.answers && app.answers.length > 0 ? (
          <View style={styles.sectionCard}>
            <SectionHeader title="Custom Answers" />
            {app.answers.map((answer) => (
              <View key={answer.uid} style={styles.answerCard}>
                <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: 2 }}>
                  {answer.label}
                </AppText>
                <AppText variant="body" style={{ fontWeight: '600' }}>
                  {answer.value_json
                    ? (answer.value_json as any[]).join(', ')
                    : answer.value_text || '-'}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        {/* Stage History */}
        {app.stage_history && app.stage_history.length > 0 ? (
          <View style={styles.sectionCard}>
            <SectionHeader title="Stage History" />
            <View style={styles.timeline}>
              {app.stage_history.map((entry, index) => {
                const isLast = index === app.stage_history.length - 1;
                return (
                  <View key={entry.uid} style={styles.timelineItem}>
                    <View style={styles.timelineLine}>
                      <View style={styles.timelineDot} />
                      {!isLast && <View style={styles.timelineConnector} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.stageChangeRow}>
                        <AppText variant="body" style={{ fontWeight: '600' }}>
                          {entry.from_stage?.name || '?'}
                        </AppText>
                        <Ionicons name="arrow-forward" size={14} color={colors.textMuted} style={{ marginHorizontal: 4 }} />
                        <AppText variant="body" style={{ fontWeight: '700', color: getStageColor(entry.to_stage?.code || '') }}>
                          {entry.to_stage?.name || '?'}
                        </AppText>
                      </View>
                      {entry.note ? (
                        <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                          {entry.note}
                        </AppText>
                      ) : null}
                      <View style={styles.timelineMeta}>
                        {entry.changed_by ? (
                          <AppText variant="caption" color={colors.textMuted}>
                            by {entry.changed_by}
                          </AppText>
                        ) : null}
                        <AppText variant="caption" color={colors.textMuted}>
                          {formatDate(entry.changed_at)}
                        </AppText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Interviews */}
        <View style={styles.sectionCard}>
          <View style={styles.interviewsSectionHeader}>
            <AppText variant="subtitle" style={{ fontWeight: '700', color: colors.textPrimary }}>
              Interviews
            </AppText>
            <Pressable style={styles.scheduleBtn} onPress={() => setShowScheduleModal(true)}>
              <Ionicons name="add-circle" size={18} color={colors.primary} />
              <AppText variant="caption" style={{ color: colors.primary, fontWeight: '700', marginLeft: 4 }}>
                Schedule
              </AppText>
            </Pressable>
          </View>
          {app.interviews && app.interviews.length > 0 ? (
            app.interviews.map((interview: any) => {
              const isOnline = interview.mode === 'online';
              return (
                <View key={interview.uid} style={styles.interviewCard}>
                  <View style={styles.interviewTop}>
                    <View style={styles.interviewHeader}>
                      {isOnline ? (
                        <Ionicons name="videocam-outline" size={16} color="#7C3AED" />
                      ) : (
                        <Ionicons name="location-outline" size={16} color={colors.warning} />
                      )}
                      <AppText variant="body" style={{ fontWeight: '600', marginLeft: spacing.sm }}>
                        {interview.stage_name || 'Interview'}
                      </AppText>
                    </View>
                    <View style={styles.interviewActions}>
                      <View style={[styles.attendanceBadge, {
                        backgroundColor: interview.attendance === 'present' ? colors.successBg
                          : interview.attendance === 'absent' ? colors.dangerBg
                          : interview.attendance === 'rescheduled' ? colors.warningSoft
                          : colors.primaryLight + '15'
                      }]}>
                        <AppText variant="caption" style={{
                          color: interview.attendance === 'present' ? colors.success
                            : interview.attendance === 'absent' ? colors.danger
                            : interview.attendance === 'rescheduled' ? colors.warning
                            : colors.primary,
                          fontWeight: '600', fontSize: 11,
                        }}>
                          {interview.attendance}
                        </AppText>
                      </View>
                      <Pressable
                        style={styles.interviewActionBtn}
                        onPress={() => setEditingInterview(interview)}
                      >
                        <Ionicons name="pencil-outline" size={14} color={colors.info} />
                      </Pressable>
                      <Pressable
                        style={styles.interviewActionBtn}
                        onPress={() => {
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
                                    { applicationUid, interviewUid: interview.uid },
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
                        }}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                  <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                    {formatDate(interview.scheduled_at)}
                  </AppText>
                  {interview.meeting_link ? (
                    <Pressable onPress={() => Linking.openURL(interview.meeting_link)}>
                      <AppText variant="caption" color={colors.primary} style={{ marginTop: 4, textDecorationLine: 'underline' }} numberOfLines={1}>
                        {interview.meeting_link}
                      </AppText>
                    </Pressable>
                  ) : null}
                  {interview.location ? (
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} /> {interview.location}
                    </AppText>
                  ) : null}
                  {interview.feedback ? (
                    <View style={styles.feedbackBox}>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {interview.feedback}
                      </AppText>
                    </View>
                  ) : null}
                  {interview.score != null ? (
                    <View style={styles.scoreBadge}>
                      <Ionicons name="star" size={12} color={colors.warning} />
                      <AppText variant="caption" style={{ color: colors.warning, fontWeight: '700', marginLeft: 3 }}>
                        {interview.score}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="calendar-outline" size={24} color={colors.textMuted} />
              <AppText variant="body" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
                No interviews scheduled
              </AppText>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AppText variant="caption" color={colors.textMuted}>
            Created: {formatDate(app.created_at)}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Updated: {formatDate(app.updated_at)}
          </AppText>
        </View>
      </ScrollView>

      <ScheduleInterviewModal
        visible={showScheduleModal || !!editingInterview}
        companyUid={companyUid}
        jobUid={jobUid}
        applicationUid={applicationUid}
        defaultStageUid={app.current_stage.uid}
        editingInterview={editingInterview}
        onClose={() => {
          setShowScheduleModal(false);
          setEditingInterview(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  /* Profile Card */
  profileCard: {
    flexDirection: 'row',
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
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusBadge: {
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
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 14,
  },
  answerCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 70,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingBottom: spacing.lg,
  },
  stageChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  timelineMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  interviewsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 10,
  },
  interviewCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  interviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  interviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  interviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  interviewActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryLight,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footer: {
    paddingVertical: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
});
