import AppModal from '@/src/components/common/AppModal';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import type { InfiniteData } from '@tanstack/react-query';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme, spacing } from '@/src/theme';
import { JobInterview, type UpdateInterviewPayload } from '../../api/jobs.api';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import { useInfiniteJobInterviews, useUpdateInterview } from '../../queries/jobs.query';

type JobInterviewsRouteProp = RouteProp<MoreStackParamList, 'JobInterviews'>;

const ATTENDANCE_OPTIONS = ['scheduled', 'present', 'absent', 'rescheduled'] as const;

function getAttendanceColor(attendance: string, colors: any): string {
  const ATTENDANCE_COLORS: Record<string, string> = {
    scheduled: colors.warning,
    present: colors.success,
    absent: colors.danger,
    rescheduled: colors.info,
  };
  return ATTENDANCE_COLORS[attendance?.toLowerCase()] || colors.textMuted;
}

function formatDateTime(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function InterviewCard({ interview, onEdit, onViewDetail }: { interview: JobInterview; onEdit: (interview: JobInterview) => void; onViewDetail: (interview: JobInterview) => void }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const attendanceColor = getAttendanceColor(interview.attendance, colors);
  const modeIcon = interview.mode?.toLowerCase() === 'online' ? 'videocam-outline' : 'location-outline';
  const modeLabel = interview.mode?.toLowerCase() === 'online' ? interview.meeting_link || 'Online' : interview.location || 'Offline';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight + '20' }]}>
          <AppText style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>
            {interview.applicant_name?.charAt(0)?.toUpperCase() || '?'}
          </AppText>
        </View>
        <View style={styles.cardInfo}>
          <AppText variant="subtitle" style={{ fontWeight: '700' }} numberOfLines={1}>
            {interview.applicant_name || 'Unknown'}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {interview.student_id}
          </AppText>
        </View>
        <View style={[styles.attendanceBadge, { backgroundColor: attendanceColor + '15' }]}>
          <AppText variant="caption" style={{ color: attendanceColor, fontWeight: '600', fontSize: 11 }}>
            {interview.attendance}
          </AppText>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 6 }}>
            {formatDateTime(interview.scheduled_at)}
          </AppText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name={modeIcon} size={14} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 6 }} numberOfLines={1}>
            {modeLabel}
          </AppText>
        </View>
        {interview.feedback && (
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 6 }} numberOfLines={2}>
              {interview.feedback}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Pressable
          style={styles.contactBtn}
          onPress={() => onViewDetail(interview)}
        >
          <Ionicons name="eye-outline" size={16} color={colors.info} />
        </Pressable>
        <Pressable
          style={styles.contactBtn}
          onPress={() => onEdit(interview)}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </Pressable>
        <Pressable
          style={styles.contactBtn}
          onPress={() => Linking.openURL(`tel:${interview.applicant_phone}`)}
        >
          <Ionicons name="call-outline" size={16} color={colors.success} />
        </Pressable>
        <Pressable
          style={styles.contactBtn}
          onPress={() => Linking.openURL(`mailto:${interview.applicant_email}`)}
        >
          <Ionicons name="mail-outline" size={16} color={colors.info} />
        </Pressable>
      </View>
    </View>
  );
}

export default function JobInterviewsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const route = useRoute<JobInterviewsRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { companyUid, jobUid } = route.params;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteJobInterviews(companyUid, jobUid, debouncedSearch);

  const interviews = useMemo(() => {
    if (!data) return [];
    return (data as InfiniteData<any>).pages.flatMap((page: any) => page.results) ?? [];
  }, [data]);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    await refetch();
    setIsManualRefreshing(false);
  }, [refetch]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: route.params?.jobTitle ? `Interviews - ${route.params.jobTitle}` : 'Interviews',
    });
  }, [navigation, route.params?.jobTitle]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return (data as InfiniteData<any>).pages[0]?.count ?? 0;
  }, [data]);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<JobInterview | null>(null);
  const [editAttendance, setEditAttendance] = useState<string>('scheduled');
  const [editFeedback, setEditFeedback] = useState('');
  const [editScore, setEditScore] = useState('');

  const updateMutation = useUpdateInterview(companyUid, jobUid);

  const openEditModal = useCallback((interview: JobInterview) => {
    setEditingInterview(interview);
    setEditAttendance(interview.attendance);
    setEditFeedback(interview.feedback || '');
    setEditScore(interview.score ? String(interview.score) : '');
    setShowEditModal(true);
  }, []);

  const handleUpdateInterview = useCallback(() => {
    if (!editingInterview) return;
    const payload: UpdateInterviewPayload = {
      attendance: editAttendance as UpdateInterviewPayload['attendance'],
    };
    if (editFeedback.trim()) payload.feedback = editFeedback.trim();
    if (editScore.trim()) payload.score = editScore.trim();
    updateMutation.mutate(
      {
        applicationUid: editingInterview.application_uid,
        interviewUid: editingInterview.uid,
        payload,
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditingInterview(null);
        },
        onError: (err: any) => {
          Alert.alert(
            'Error',
            err?.response?.data?.message || err?.response?.data?.detail || 'Failed to update interview'
          );
        },
      }
    );
  }, [editingInterview, editAttendance, editFeedback, editScore, updateMutation]);

  const openViewDetail = useCallback((interview: JobInterview) => {
    (navigation as any).navigate('InterviewDetail', {
      companyUid,
      jobUid,
      applicationUid: interview.application_uid,
      interviewUid: interview.uid,
      applicantName: interview.applicant_name,
    });
  }, [navigation, companyUid, jobUid]);

  const renderItem = useCallback(({ item }: { item: JobInterview }) => (
    <InterviewCard interview={item} onEdit={openEditModal} onViewDetail={openViewDetail} />
  ), [openEditModal, openViewDetail]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    if (isError) {
      const err = error as any;
      return (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <AppText color={colors.danger} style={{ marginTop: spacing.md, textAlign: 'center' }}>
            {err?.response?.data?.detail || err?.message || 'Failed to load interviews'}
          </AppText>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <AppText color={colors.primary}>Try Again</AppText>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="calendar-outline" size={32} color={colors.primary} />
        </View>
        <AppText variant="subtitle">No interviews</AppText>
        <AppText color={colors.textMuted} style={{ textAlign: 'center', marginTop: 4 }}>
          No interviews found for this job
        </AppText>
      </View>
    );
  }, [isLoading, isError, error, refetch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top > 0 ? 0 : spacing.sm }]}>
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <AppInput
          placeholder="Search name, email, phone..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchContainer}
          style={styles.searchInput}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Count */}
      {!isLoading && !isError && interviews.length > 0 && (
        <View style={styles.countRow}>
          <AppText variant="caption" color={colors.textMuted}>
            {totalCount} interview{totalCount !== 1 ? 's' : ''}
          </AppText>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <AppLoader />
      ) : (
        <FlashList
          data={interviews}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.md }}>
                <AppLoader />
              </View>
            ) : null
          }
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Edit Interview Modal */}
      <AppModal statusBarTranslucent navigationBarTranslucent visible={showEditModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => !updateMutation.isPending && setShowEditModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                <AppText variant="h3" style={{ fontWeight: '700', marginLeft: spacing.sm }}>
                  Edit Interview
                </AppText>
              </View>

              <AppText variant="body" style={{ fontWeight: '600', marginBottom: 2 }}>
                {editingInterview?.applicant_name}
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.lg }}>
                {editingInterview?.stage_name}
              </AppText>

              {/* Attendance */}
              <AppText variant="caption" style={styles.fieldLabel}>Attendance</AppText>
              <View style={styles.attendanceRow}>
                {ATTENDANCE_OPTIONS.map(opt => {
                  const active = editAttendance === opt;
                  const color = getAttendanceColor(opt, colors) || colors.primary;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setEditAttendance(opt)}
                      style={[
                        styles.attendanceChip,
                        active && { backgroundColor: color + '20', borderColor: color },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={{
                          fontWeight: active ? '700' : '500',
                          color: active ? color : colors.textSecondary,
                          textTransform: 'capitalize',
                        }}
                      >
                        {opt}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Score */}
              <AppText variant="caption" style={styles.fieldLabel}>Score (optional)</AppText>
              <View style={styles.formInputContainer}>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={editScore}
                  onChangeText={setEditScore}
                  keyboardType="decimal-pad"
                  style={styles.formInput}
                />
              </View>

              {/* Feedback */}
              <AppText variant="caption" style={styles.fieldLabel}>Feedback (optional)</AppText>
              <View style={styles.formInputContainer}>
                <TextInput
                  placeholder="Add feedback..."
                  placeholderTextColor={colors.textMuted}
                  value={editFeedback}
                  onChangeText={setEditFeedback}
                  multiline
                  numberOfLines={3}
                  style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                />
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleUpdateInterview}
                disabled={updateMutation.isPending}
                style={[styles.submitBtn, updateMutation.isPending && { opacity: 0.6 }]}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <AppText style={{ color: colors.surface, fontWeight: '700' }}>Update</AppText>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </AppModal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
    marginTop: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  searchInput: {
    height: 44,
    fontSize: 14,
  },
  countRow: {
    paddingHorizontal: spacing.lg + 4,
    marginBottom: spacing.xs,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  attendanceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  cardBody: {
    gap: 6,
    marginBottom: spacing.sm,
    paddingLeft: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: spacing.sm,
  },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginLeft: 2,
  },
  attendanceRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  attendanceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surfaceSubtle,
    backgroundColor: colors.surface,
  },
  formInputContainer: {
    backgroundColor: colors.primaryLight + '10',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
  },
  formInput: {
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 48,
  },
});
