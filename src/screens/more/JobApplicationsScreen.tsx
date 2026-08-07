import AppModal from '@/src/components/common/AppModal';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { JobApplication, JobStage, type ChangeStagePayload } from '../../api/jobs.api';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import { useChangeApplicationStage, useInfiniteJobApplications, useJobStages } from '../../queries/jobs.query';

type JobApplicationsRouteProp = RouteProp<MoreStackParamList, 'JobApplications'>;

function getStageColor(code: string, colors: any): string {
  const STAGE_COLORS: Record<string, string> = {
    applied: colors.info,
    screening: colors.warning,
    interview: '#7C3AED',
    offer: colors.success,
    rejected: colors.danger,
  };
  return STAGE_COLORS[code] || colors.primary;
}

function ApplicationCard({
  application,
  stages,
  onMoveStage,
  companyUid,
  jobUid,
}: {
  application: JobApplication;
  stages: JobStage[];
  onMoveStage: (application: JobApplication) => void;
  companyUid: string;
  jobUid: string;
}) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const nav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const stageColor = getStageColor(application.current_stage.code, colors);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: stageColor + '20' }]}>
            <AppText style={{ color: stageColor, fontWeight: '800', fontSize: 16 }}>
              {application.applicant_name.charAt(0).toUpperCase()}
            </AppText>
          </View>
        </View>
        <View style={styles.cardInfo}>
          <AppText variant="subtitle" style={{ fontWeight: '700' }} numberOfLines={1}>
            {application.applicant_name}
          </AppText>
          <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
            {application.student_id}
          </AppText>
        </View>
        <View style={[styles.stageBadge, { backgroundColor: stageColor + '15' }]}>
          <AppText variant="caption" style={{ color: stageColor, fontWeight: '600', fontSize: 11 }}>
            {application.current_stage.name}
          </AppText>
        </View>
      </View>

      <View style={styles.cardContact}>
        <Pressable
          style={styles.contactChip}
          onPress={() => Linking.openURL(`tel:${application.applicant_phone}`)}
        >
          <Ionicons name="call-outline" size={14} color={colors.success} />
          <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
            {application.applicant_phone}
          </AppText>
        </Pressable>
        <Pressable
          style={styles.contactChip}
          onPress={() => Linking.openURL(`mailto:${application.applicant_email}`)}
        >
          <Ionicons name="mail-outline" size={14} color={colors.info} />
          <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }} numberOfLines={1}>
            {application.applicant_email}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.cardFooter}>
        <AppText variant="caption" color={colors.textMuted}>
          Applied {new Date(application.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </AppText>
        <View style={styles.cardActions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() =>
              nav.navigate('ApplicantDetail', {
                companyUid,
                jobUid,
                applicationUid: application.uid,
              })
            }
          >
            <Ionicons name="eye-outline" size={16} color={colors.info} />
          </Pressable>
          {application.resume_file && (
            <Pressable
              style={styles.actionBtn}
              onPress={() => Linking.openURL(application.resume_file!)}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            </Pressable>
          )}
          <Pressable
            style={styles.actionBtn}
            onPress={() => onMoveStage(application)}
          >
            <Ionicons name="swap-horizontal-outline" size={16} color={colors.warning} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function JobApplicationsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const route = useRoute<JobApplicationsRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { companyUid, jobUid } = route.params;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStageUid, setSelectedStageUid] = useState<string | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [movingApplication, setMovingApplication] = useState<JobApplication | null>(null);
  const [moveNote, setMoveNote] = useState('');

  const changeStageMutation = useChangeApplicationStage(companyUid, jobUid);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: stagesResponse, isLoading: stagesLoading } = useJobStages(companyUid, jobUid);

  const sortedStages = useMemo(() => {
    if (!stagesResponse?.results) return [];
    return [...stagesResponse.results].sort((a, b) => a.sort_order - b.sort_order);
  }, [stagesResponse]);

  useEffect(() => {
    if (!selectedStageUid && sortedStages.length > 0) {
      setSelectedStageUid(sortedStages[0].uid);
    }
  }, [sortedStages, selectedStageUid]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteJobApplications(companyUid, jobUid, selectedStageUid ?? '', debouncedSearch);

  const applications = useMemo(() => {
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
      title: route.params?.jobTitle || 'Applications',
    });
  }, [navigation, route.params?.jobTitle]);

  const selectedStageName = useMemo(() => {
    if (!selectedStageUid) return '';
    const stage = sortedStages.find(s => s.uid === selectedStageUid);
    return stage?.name || '';
  }, [selectedStageUid, sortedStages]);

  const appCount = useMemo(() => {
    if (!data) return 0;
    const firstPage = (data as InfiniteData<any>).pages[0];
    return firstPage?.count ?? 0;
  }, [data]);

  const handleMoveStage = useCallback((application: JobApplication) => {
    setMovingApplication(application);
    setMoveNote('');
    setShowStageModal(true);
  }, []);

  const confirmMoveStage = useCallback((targetStage: JobStage) => {
    if (!movingApplication) return;
    const payload: ChangeStagePayload = {
      stage_uid: targetStage.uid,
    };
    if (moveNote.trim()) {
      payload.note = moveNote.trim();
    }
    changeStageMutation.mutate(
      { applicationUid: movingApplication.uid, payload },
      {
        onSuccess: () => {
          setShowStageModal(false);
          setMovingApplication(null);
          setMoveNote('');
        },
        onError: (err: any) => {
          Alert.alert(
            'Error',
            err?.response?.data?.message || err?.response?.data?.detail || 'Failed to change stage'
          );
        },
      }
    );
  }, [movingApplication, moveNote, changeStageMutation]);

  const renderItem = useCallback(({ item }: { item: JobApplication }) => (
    <ApplicationCard
      application={item}
      stages={sortedStages}
      onMoveStage={handleMoveStage}
      companyUid={companyUid}
      jobUid={jobUid}
    />
  ), [sortedStages, handleMoveStage, companyUid, jobUid]);

  const renderEmpty = useCallback(() => {
    if (isLoading || stagesLoading) return null;
    if (isError) {
      const err = error as any;
      return (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <AppText color={colors.danger} style={{ marginTop: spacing.md, textAlign: 'center' }}>
            {err?.response?.data?.detail || err?.message || 'Failed to load applications'}
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
          <Ionicons name="people-outline" size={32} color={colors.primary} />
        </View>
        <AppText variant="subtitle">No applications</AppText>
        <AppText color={colors.textMuted} style={{ textAlign: 'center', marginTop: 4 }}>
          No applications found in {selectedStageName || 'this stage'}
        </AppText>
      </View>
    );
  }, [isLoading, stagesLoading, isError, error, refetch, selectedStageName]);

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

      {/* Stage Tabs */}
      {stagesLoading ? (
        <View style={styles.tabsLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          style={{ flexGrow: 0 }}
        >
          {sortedStages.map(stage => {
            const isActive = selectedStageUid === stage.uid;
            const stageColor = getStageColor(stage.code, colors);
            return (
              <Pressable
                key={stage.uid}
                onPress={() => setSelectedStageUid(stage.uid)}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: stageColor + '20', borderColor: stageColor },
                ]}
              >
                <AppText
                  variant="caption"
                  style={[
                    styles.tabText,
                    isActive && { color: stageColor, fontWeight: '700' },
                  ]}
                >
                  {stage.name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Count */}
      {!isLoading && !isError && applications.length > 0 && (
        <View style={styles.countRow}>
          <AppText variant="caption" color={colors.textMuted}>
            {appCount} application{appCount !== 1 ? 's' : ''}
          </AppText>
        </View>
      )}

      {/* Applications List */}
      {isLoading && stagesLoading ? (
        <AppLoader />
      ) : (
        <FlashList
          data={applications}
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

      {/* Move Stage Modal */}
      <AppModal statusBarTranslucent navigationBarTranslucent visible={showStageModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setShowStageModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.lg }}>
              {"Move \"" + movingApplication?.applicant_name + "\""}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
              Select target stage:
            </AppText>
            <View style={styles.noteInputContainer}>
              <TextInput
                placeholder="Note (optional)"
                placeholderTextColor={colors.textMuted}
                value={moveNote}
                onChangeText={setMoveNote}
                style={styles.noteInput}
                multiline
              />
            </View>
            {sortedStages.map(stage => {
              const isCurrent = stage.uid === movingApplication?.current_stage.uid;
              const stageColor = getStageColor(stage.code, colors);
              const isLoading = changeStageMutation.isPending;
              return (
                <Pressable
                  key={stage.uid}
                  disabled={isCurrent || isLoading}
                  onPress={() => confirmMoveStage(stage)}
                  style={[
                    styles.stageOption,
                    (isCurrent || isLoading) && styles.stageOptionDisabled,
                  ]}
                >
                  <View style={[styles.stageDot, { backgroundColor: stageColor }]} />
                  <View style={{ flex: 1 }}>
                    <AppText
                      variant="body"
                      style={{
                        fontWeight: isCurrent ? '400' : '600',
                        color: isCurrent ? colors.textMuted : colors.textPrimary,
                      }}
                    >
                      {stage.name}
                    </AppText>
                    {stage.is_terminal && (
                      <AppText variant="caption" color={colors.textMuted}>
                        Terminal stage
                      </AppText>
                    )}
                  </View>
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <AppText variant="caption" style={{ color: colors.primary, fontSize: 10 }}>
                        Current
                      </AppText>
                    </View>
                  )}
                  {isLoading && !isCurrent && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
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
  tabsLoading: {
    paddingVertical: spacing.xs + 4,
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    backgroundColor: colors.surface,
  },
  tabText: {
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 12,
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
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  stageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  cardContact: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 34,
    height: 34,
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
  noteInputContainer: {
    backgroundColor: colors.neutralSoft || '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
  },
  noteInput: {
    minHeight: 44,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  stageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: colors.surface,
  },
  stageOptionDisabled: {
    opacity: 0.5,
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  currentBadge: {
    backgroundColor: colors.primaryLight + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
