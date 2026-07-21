import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme, spacing } from '@/src/theme';
import type { Batch } from '../../api/batches.api';
import { broadcastJob, type BroadcastJobPayload } from '../../api/jobs.api';
import { fetchBatchesPage, fetchCoursesPage } from '../../api/masters/paginatedMasters.api';
import { fetchStudents, type StudentResponse } from '../../api/students.api';
import AppLoader from '../common/AppLoader';
import AppText from '../common/AppText';
import type { Course } from '@/src/types/course';

type Tab = 'batches' | 'students';

type Props = {
  visible: boolean;
  onClose: () => void;
  companyUid: string;
  jobUid: string;
  jobTitle: string;
  companyName: string;
};

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function ShareJobModal({ visible, onClose, companyUid, jobUid, jobTitle, companyName }: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('batches');

  // -- Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesHasNext, setCoursesHasNext] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesSearch, setCoursesSearch] = useState('');
  const debouncedCoursesSearch = useDebounce(coursesSearch, 400);

  // -- Batches state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesPage, setBatchesPage] = useState(1);
  const [batchesHasNext, setBatchesHasNext] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesSearch, setBatchesSearch] = useState('');
  const debouncedBatchesSearch = useDebounce(batchesSearch, 400);
  const [selectedBatchUids, setSelectedBatchUids] = useState<Set<string>>(new Set());

  // -- Students state
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsHasNext, setStudentsHasNext] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsSearch, setStudentsSearch] = useState('');
  const debouncedStudentsSearch = useDebounce(studentsSearch, 400);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const [sending, setSending] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setTab('batches');
      setSelectedCourse(null);
      setSelectedBatchUids(new Set());
      setSelectedStudentIds(new Set());
      setCoursesSearch('');
      setBatchesSearch('');
      setStudentsSearch('');
    }
  }, [visible]);

  // -- Load courses
  const loadCourses = useCallback(async (page: number, reset: boolean) => {
    setCoursesLoading(true);
    try {
      const res = await fetchCoursesPage({ page, pageSize: 20, search: debouncedCoursesSearch || undefined });
      setCourses(prev => reset ? res.items : [...prev, ...res.items]);
      setCoursesHasNext(res.hasNextPage);
      setCoursesPage(page);
    } catch { /* ignore */ } finally {
      setCoursesLoading(false);
    }
  }, [debouncedCoursesSearch]);

  useEffect(() => {
    if (visible && !selectedCourse) loadCourses(1, true);
  }, [debouncedCoursesSearch, visible, selectedCourse]);

  // -- Load batches
  const loadBatches = useCallback(async (page: number, reset: boolean) => {
    if (!selectedCourse) return;
    setBatchesLoading(true);
    try {
      const res = await fetchBatchesPage({
        page,
        pageSize: 20,
        search: debouncedBatchesSearch || undefined,
        courseId: selectedCourse.id,
      });
      setBatches(prev => reset ? res.items : [...prev, ...res.items]);
      setBatchesHasNext(res.hasNextPage);
      setBatchesPage(page);
    } catch { /* ignore */ } finally {
      setBatchesLoading(false);
    }
  }, [debouncedBatchesSearch, selectedCourse]);

  useEffect(() => {
    if (visible && selectedCourse) loadBatches(1, true);
  }, [debouncedBatchesSearch, visible, selectedCourse]);

  // -- Load students
  const loadStudents = useCallback(async (page: number, reset: boolean) => {
    setStudentsLoading(true);
    try {
      const res = await fetchStudents(page, 20, debouncedStudentsSearch);
      setStudents(prev => reset ? res.students : [...prev, ...res.students]);
      setStudentsHasNext(res.pagination.has_next);
      setStudentsPage(page);
    } catch { /* ignore */ } finally {
      setStudentsLoading(false);
    }
  }, [debouncedStudentsSearch]);

  useEffect(() => {
    if (visible && tab === 'students') loadStudents(1, true);
  }, [debouncedStudentsSearch, visible, tab]);

  // -- Selection toggles
  const toggleBatch = useCallback((uid: string) => {
    setSelectedBatchUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const toggleStudent = useCallback((studentId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }, []);

  // -- Send broadcast
  const handleSend = useCallback(async () => {
    const payload: BroadcastJobPayload = {
      dry_run: false,
      send_push: true,
      title: `New Job Opportunity: ${jobTitle}`,
      message: `We have a new job opening for ${jobTitle} at ${companyName}. Check the job details and apply now!`,
    };

    if (tab === 'batches') {
      if (selectedBatchUids.size === 0) {
        Alert.alert('Selection Required', 'Please select at least one batch.');
        return;
      }
      payload.batch_uids = Array.from(selectedBatchUids);
    } else {
      if (selectedStudentIds.size === 0) {
        Alert.alert('Selection Required', 'Please select at least one student.');
        return;
      }
      payload.student_ids = Array.from(selectedStudentIds);
    }

    setSending(true);
    try {
      await broadcastJob(companyUid, jobUid, payload);
      Alert.alert('Success', 'Job broadcast sent successfully.');
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      Alert.alert(
        'Error',
        data?.detail || data?.error || data?.message || 'Failed to send broadcast.'
      );
    } finally {
      setSending(false);
    }
  }, [tab, selectedBatchUids, selectedStudentIds, companyUid, jobUid, jobTitle, companyName, onClose]);

  const selectedCount = tab === 'batches' ? selectedBatchUids.size : selectedStudentIds.size;

  return (
    <Modal statusBarTranslucent navigationBarTranslucent visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior="padding" style={styles.sheetWrapper}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="h3" style={{ fontWeight: '800' }}>Share Job</AppText>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Tab bar */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, tab === 'batches' && styles.tabActive]}
            onPress={() => setTab('batches')}
          >
            <Ionicons name="grid-outline" size={16} color={tab === 'batches' ? colors.primary : colors.textMuted} />
            <AppText variant="caption" style={[styles.tabLabel, tab === 'batches' && styles.tabLabelActive]}>
              By Batches
            </AppText>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'students' && styles.tabActive]}
            onPress={() => setTab('students')}
          >
            <Ionicons name="people-outline" size={16} color={tab === 'students' ? colors.primary : colors.textMuted} />
            <AppText variant="caption" style={[styles.tabLabel, tab === 'students' && styles.tabLabelActive]}>
              By Students
            </AppText>
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {tab === 'batches' ? (
            selectedCourse ? (
              /* Batch selection panel */
              <View style={{ flex: 1 }}>
                <View style={styles.subHeader}>
                  <Pressable onPress={() => { setSelectedCourse(null); setBatches([]); setBatchesSearch(''); }} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={18} color={colors.primary} />
                    <AppText variant="caption" color={colors.primary} style={{ fontWeight: '600', marginLeft: 4 }}>
                      Back
                    </AppText>
                  </Pressable>
                  <AppText variant="caption" color={colors.textMuted} numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
                    {selectedCourse.course_name}
                  </AppText>
                </View>
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                  <TextInput
                    placeholder="Search batches..."
                    placeholderTextColor={colors.textMuted}
                    value={batchesSearch}
                    onChangeText={setBatchesSearch}
                    style={styles.searchInput}
                  />
                  {batchesSearch ? (
                    <Pressable onPress={() => setBatchesSearch('')}>
                      <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
                <FlatList
                  data={batches}
                  keyExtractor={(item) => item.uid}
                  renderItem={({ item }) => {
                    const checked = selectedBatchUids.has(item.uid);
                    return (
                      <Pressable style={styles.selectRow} onPress={() => toggleBatch(item.uid)}>
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked && <Ionicons name="checkmark" size={14} color={colors.surface} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText variant="body" style={{ fontWeight: '600' }}>{item.batch_name}</AppText>
                          <AppText variant="caption" color={colors.textMuted}>{item.course_name}</AppText>
                        </View>
                      </Pressable>
                    );
                  }}
                  onEndReached={() => {
                    if (batchesHasNext && !batchesLoading) loadBatches(batchesPage + 1, false);
                  }}
                  onEndReachedThreshold={0.3}
                  ListFooterComponent={
                    batchesLoading ? <ActivityIndicator size="small" color={colors.primary} style={{ padding: spacing.md }} /> : null
                  }
                  ListEmptyComponent={
                    !batchesLoading ? (
                      <View style={styles.emptyState}>
                        <AppText color={colors.textMuted}>No batches found</AppText>
                      </View>
                    ) : null
                  }
                  contentContainerStyle={{ paddingBottom: spacing.md }}
                />
              </View>
            ) : (
              /* Course selection panel */
              <View style={{ flex: 1 }}>
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                  <TextInput
                    placeholder="Search courses..."
                    placeholderTextColor={colors.textMuted}
                    value={coursesSearch}
                    onChangeText={setCoursesSearch}
                    style={styles.searchInput}
                  />
                  {coursesSearch ? (
                    <Pressable onPress={() => setCoursesSearch('')}>
                      <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
                <FlatList
                  data={courses}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <Pressable style={styles.selectRow} onPress={() => setSelectedCourse(item)}>
                      <Ionicons name="book-outline" size={20} color={colors.primary} />
                      <AppText variant="body" style={{ fontWeight: '600', marginLeft: spacing.md, flex: 1 }}>
                        {item.course_name}
                      </AppText>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </Pressable>
                  )}
                  onEndReached={() => {
                    if (coursesHasNext && !coursesLoading) loadCourses(coursesPage + 1, false);
                  }}
                  onEndReachedThreshold={0.3}
                  ListFooterComponent={
                    coursesLoading ? <ActivityIndicator size="small" color={colors.primary} style={{ padding: spacing.md }} /> : null
                  }
                  ListEmptyComponent={
                    !coursesLoading ? (
                      <View style={styles.emptyState}>
                        <AppText color={colors.textMuted}>No courses found</AppText>
                      </View>
                    ) : null
                  }
                  contentContainerStyle={{ paddingBottom: spacing.md }}
                />
              </View>
            )
          ) : (
            /* Students tab */
            <View style={{ flex: 1 }}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                <TextInput
                  placeholder="Search students..."
                  placeholderTextColor={colors.textMuted}
                  value={studentsSearch}
                  onChangeText={setStudentsSearch}
                  style={styles.searchInput}
                />
                {studentsSearch ? (
                  <Pressable onPress={() => setStudentsSearch('')}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
              <FlatList
                data={students}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) => {
                  const checked = selectedStudentIds.has(item.student_id);
                  return (
                    <Pressable style={styles.selectRow} onPress={() => toggleStudent(item.student_id)}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Ionicons name="checkmark" size={14} color={colors.surface} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="body" style={{ fontWeight: '600' }}>{item.full_name}</AppText>
                        <AppText variant="caption" color={colors.textMuted}>{item.student_id}</AppText>
                      </View>
                    </Pressable>
                  );
                }}
                onEndReached={() => {
                  if (studentsHasNext && !studentsLoading) loadStudents(studentsPage + 1, false);
                }}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  studentsLoading ? <ActivityIndicator size="small" color={colors.primary} style={{ padding: spacing.md }} /> : null
                }
                ListEmptyComponent={
                  !studentsLoading ? (
                    <View style={styles.emptyState}>
                      <AppText color={colors.textMuted}>No students found</AppText>
                    </View>
                  ) : null
                }
                contentContainerStyle={{ paddingBottom: spacing.md }}
              />
            </View>
          )}
        </View>

        {/* Footer */}
        {selectedCount > 0 ? (
          <View style={styles.footer}>
            <AppText variant="caption" color={colors.textSecondary}>
              {selectedCount} selected
            </AppText>
            <Pressable
              onPress={handleSend}
              disabled={sending}
              style={[styles.sendBtn, sending && { opacity: 0.6 }]}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color={colors.surface} />
                  <AppText style={{ color: colors.surface, fontWeight: '700', marginLeft: spacing.sm }}>
                    Send Broadcast
                  </AppText>
                </>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '95%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  closeBtn: {
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    gap: spacing.xs,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '12',
  },
  tabLabel: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    backgroundColor: colors.background,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md - 2,
    borderRadius: 14,
    minHeight: 44,
  },
});
