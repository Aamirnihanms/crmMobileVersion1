import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import AppText from '@/src/components/common/AppText';
import {
    createExamSession,
    CreateExamSessionPayload,
    fetchBatchStudents,
    fetchExamTypes,
    fetchTemplatesByCourse,
    fetchTemplateWithModules,
} from '@/src/api/evaluation.api';
import { fetchBatchDetail } from '@/src/api/batches.api';
import { colors, spacing } from '@/src/theme';

type Props = {
    visible: boolean;
    onClose: () => void;
    batch: any; // must have: uid, batch_name, course_id (or course_details.id)
};

type StudentSelectionMode = 'all' | 'specific';

export default function CreateExamSessionSheet({ visible, onClose, batch }: Props) {
    /* ── State ── */
    const [examName, setExamName] = useState('');
    const [selectedTemplateUid, setSelectedTemplateUid] = useState('');
    const [selectedModuleUid, setSelectedModuleUid] = useState('');
    const [selectedExamTypeId, setSelectedExamTypeId] = useState<number | null>(null);

    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [studentMode, setStudentMode] = useState<StudentSelectionMode>('all');
    const [selectedStudentUids, setSelectedStudentUids] = useState<string[]>([]);

    /* ── Queries — only fire when modal is open ── */
    const { data: batchDetailData, isLoading: loadingBatchDetail } = useQuery({
        queryKey: ['batch-detail', batch?.uid],
        queryFn: () => fetchBatchDetail(batch!.uid),
        enabled: visible && !!batch?.uid,
    });
    const courseId: number = (batchDetailData as any)?.batch?.course ?? 0;

    const { data: templates = [], isLoading: loadingTemplates } = useQuery({
        queryKey: ['templates-by-course', courseId],
        queryFn: () => fetchTemplatesByCourse(courseId),
        enabled: visible && !!courseId,
    });

    const { data: templateDetail, isLoading: loadingModules } = useQuery({
        queryKey: ['template-modules', selectedTemplateUid],
        queryFn: () => fetchTemplateWithModules(selectedTemplateUid),
        enabled: visible && !!selectedTemplateUid,
    });

    const { data: examTypes = [], isLoading: loadingTypes } = useQuery({
        queryKey: ['exam-types'],
        queryFn: fetchExamTypes,
        enabled: visible,
    });

    const { data: batchStudents = [], isLoading: loadingStudents } = useQuery({
        queryKey: ['batch-students', batch?.uid],
        queryFn: () => fetchBatchStudents(batch!.uid),
        enabled: visible && !!batch?.uid,
    });

    const modules: any[] = templateDetail?.modules ?? [];

    /* ── Mutation ── */
    const queryClient = useQueryClient();
    const createMutation = useMutation({
        mutationFn: (payload: CreateExamSessionPayload) => createExamSession(payload),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['exam-sessions', vars.batch_uid] });
        },
    });

    /* ── Reset on open ── */
    useEffect(() => {
        if (visible) {
            setExamName('');
            setSelectedTemplateUid('');
            setSelectedModuleUid('');
            setSelectedExamTypeId(null);
            setScheduledDate(new Date());
            setStudentMode('all');
            setSelectedStudentUids([]);
        }
    }, [visible]);

    /* ── Reset module when template changes ── */
    useEffect(() => {
        setSelectedModuleUid('');
    }, [selectedTemplateUid]);

    /* ── Handlers ── */
    const toggleStudent = (uid: string) => {
        setSelectedStudentUids((prev) =>
            prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
        );
    };

    const handleSubmit = () => {
        if (!examName.trim()) {
            Alert.alert('Required', 'Please enter an exam name.');
            return;
        }
        if (!selectedTemplateUid) {
            Alert.alert('Required', 'Please select an evaluation template.');
            return;
        }
        if (!selectedExamTypeId) {
            Alert.alert('Required', 'Please select an exam type.');
            return;
        }
        if (studentMode === 'specific' && selectedStudentUids.length === 0) {
            Alert.alert('Required', 'Please select at least one student or switch to "All Students".');
            return;
        }

        const payload: any = {
            batch_uid: batch.uid,
            exam_name: examName.trim(),
            exam_type_id: selectedExamTypeId,
            generate_attempts: true,
            template_uid: selectedTemplateUid,
            scheduled_date: scheduledDate.toISOString(),
        };

        if (selectedModuleUid) payload.module_uid = selectedModuleUid;
        if (studentMode === 'specific') payload.student_uids = selectedStudentUids;

        createMutation.mutate(payload, {
            onSuccess: () => {
                Alert.alert('Success', 'Exam session created successfully!');
                onClose();
            },
            onError: (err: any) => {
                const msg =
                    err?.response?.data?.message ||
                    err?.response?.data?.detail ||
                    'Failed to create exam session. Please try again.';
                Alert.alert('Error', msg);
            },
        });
    };

    const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    const formattedTime = scheduledDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const isLoading = loadingBatchDetail || loadingTemplates || loadingTypes;
    const isSaving = createMutation.isPending;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <Pressable style={styles.backdrop} onPress={onClose} />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.sheetWrapper}
                    >
                        <View style={styles.sheet}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.handle} />
                                <View style={styles.titleRow}>
                                    <AppText variant="h3" style={styles.title}>
                                        New Exam Session
                                    </AppText>
                                    <Pressable onPress={onClose} style={styles.closeBtn}>
                                        <Ionicons name="close" size={22} color={colors.textMuted} />
                                    </Pressable>
                                </View>
                                <AppText variant="caption" color={colors.textMuted}>
                                    {batch?.batch_name}
                                </AppText>
                            </View>

                            {isLoading ? (
                                <View style={styles.loadingBox}>
                                    <ActivityIndicator color={colors.primary} />
                                    <AppText color={colors.textMuted} style={{ marginTop: 8 }}>
                                        Loading form data…
                                    </AppText>
                                </View>
                            ) : (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={styles.scrollContent}
                                >
                                    {/* Exam Name */}
                                    <SectionLabel>Exam Name *</SectionLabel>
                                    <View style={styles.inputBox}>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="e.g. Final Mock Exam"
                                            placeholderTextColor={colors.textMuted}
                                            value={examName}
                                            onChangeText={setExamName}
                                        />
                                    </View>

                                    {/* Template Selection */}
                                    <SectionLabel>Evaluation Template *</SectionLabel>
                                    {templates.length === 0 ? (
                                        <View style={styles.emptyMsg}>
                                            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
                                            <AppText variant="caption" color={colors.warning} style={{ marginLeft: 6 }}>
                                                No active templates found for this course.
                                            </AppText>
                                        </View>
                                    ) : (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={styles.chipRow}>
                                                {templates.map((t: any) => (
                                                    <ChipButton
                                                        key={t.uid}
                                                        label={t.name}
                                                        selected={selectedTemplateUid === t.uid}
                                                        onPress={() => setSelectedTemplateUid(t.uid)}
                                                    />
                                                ))}
                                            </View>
                                        </ScrollView>
                                    )}

                                    {/* Module Selection (optional) */}
                                    {selectedTemplateUid ? (
                                        <>
                                            <SectionLabel>Module (Optional)</SectionLabel>
                                            {loadingModules ? (
                                                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
                                            ) : modules.length === 0 ? (
                                                <AppText variant="caption" color={colors.textMuted}>
                                                    No modules in this template.
                                                </AppText>
                                            ) : (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                    <View style={styles.chipRow}>
                                                        <ChipButton
                                                            label="None"
                                                            selected={selectedModuleUid === ''}
                                                            onPress={() => setSelectedModuleUid('')}
                                                            variant="neutral"
                                                        />
                                                        {modules.map((m: any) => (
                                                            <ChipButton
                                                                key={m.uid}
                                                                label={m.module_name}
                                                                selected={selectedModuleUid === m.uid}
                                                                onPress={() => setSelectedModuleUid(m.uid)}
                                                            />
                                                        ))}
                                                    </View>
                                                </ScrollView>
                                            )}
                                        </>
                                    ) : null}

                                    {/* Exam Type */}
                                    <SectionLabel>Exam Type *</SectionLabel>
                                    <View style={styles.typeGrid}>
                                        {examTypes.map((et: any) => (
                                            <Pressable
                                                key={et.id}
                                                style={[
                                                    styles.typeCard,
                                                    selectedExamTypeId === et.id && styles.typeCardSelected,
                                                ]}
                                                onPress={() => setSelectedExamTypeId(et.id)}
                                            >
                                                <AppText
                                                    variant="caption"
                                                    style={[
                                                        styles.typeCardText,
                                                        selectedExamTypeId === et.id && { color: colors.primary },
                                                    ]}
                                                >
                                                    {et.name}
                                                </AppText>
                                            </Pressable>
                                        ))}
                                    </View>

                                    {/* Date & Time */}
                                    <SectionLabel>Scheduled Date & Time *</SectionLabel>
                                    <View style={styles.dateRow}>
                                        <Pressable
                                            style={styles.datePill}
                                            onPress={() => setShowDatePicker(true)}
                                        >
                                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                                            <AppText variant="body" color={colors.textPrimary} style={styles.datePillText}>
                                                {formattedDate}
                                            </AppText>
                                        </Pressable>
                                        <Pressable
                                            style={styles.datePill}
                                            onPress={() => setShowTimePicker(true)}
                                        >
                                            <Ionicons name="time-outline" size={16} color={colors.primary} />
                                            <AppText variant="body" color={colors.textPrimary} style={styles.datePillText}>
                                                {formattedTime}
                                            </AppText>
                                        </Pressable>
                                    </View>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={scheduledDate}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(_, date) => {
                                                setShowDatePicker(false);
                                                if (date) {
                                                    const merged = new Date(scheduledDate);
                                                    merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                                                    setScheduledDate(merged);
                                                }
                                            }}
                                        />
                                    )}
                                    {showTimePicker && (
                                        <DateTimePicker
                                            value={scheduledDate}
                                            mode="time"
                                            is24Hour={false}
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(_, date) => {
                                                setShowTimePicker(false);
                                                if (date) {
                                                    const merged = new Date(scheduledDate);
                                                    merged.setHours(date.getHours(), date.getMinutes());
                                                    setScheduledDate(merged);
                                                }
                                            }}
                                        />
                                    )}

                                    {/* Student Eligibility */}
                                    <SectionLabel>Eligible Students</SectionLabel>
                                    <View style={styles.segmentRow}>
                                        <Pressable
                                            style={[
                                                styles.segment,
                                                studentMode === 'all' && styles.segmentActive,
                                            ]}
                                            onPress={() => setStudentMode('all')}
                                        >
                                            <Ionicons
                                                name="people"
                                                size={16}
                                                color={studentMode === 'all' ? colors.surface : colors.textMuted}
                                            />
                                            <AppText
                                                variant="caption"
                                                style={[
                                                    styles.segmentText,
                                                    studentMode === 'all' && { color: colors.surface },
                                                ]}
                                            >
                                                All Students
                                            </AppText>
                                        </Pressable>
                                        <Pressable
                                            style={[
                                                styles.segment,
                                                studentMode === 'specific' && styles.segmentActive,
                                            ]}
                                            onPress={() => setStudentMode('specific')}
                                        >
                                            <Ionicons
                                                name="person-add"
                                                size={16}
                                                color={studentMode === 'specific' ? colors.surface : colors.textMuted}
                                            />
                                            <AppText
                                                variant="caption"
                                                style={[
                                                    styles.segmentText,
                                                    studentMode === 'specific' && { color: colors.surface },
                                                ]}
                                            >
                                                Select Specific
                                            </AppText>
                                        </Pressable>
                                    </View>

                                    {studentMode === 'specific' && (
                                        <>
                                            {loadingStudents ? (
                                                <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
                                            ) : batchStudents.length === 0 ? (
                                                <AppText variant="caption" color={colors.textMuted}>
                                                    No students found in this batch.
                                                </AppText>
                                            ) : (
                                                <>
                                                    <View style={styles.studentSelectHeader}>
                                                        <AppText variant="caption" color={colors.textMuted}>
                                                            {selectedStudentUids.length} of {batchStudents.length} selected
                                                        </AppText>
                                                        <Pressable
                                                            onPress={() => {
                                                                if (selectedStudentUids.length === batchStudents.length) {
                                                                    setSelectedStudentUids([]);
                                                                } else {
                                                                    setSelectedStudentUids(batchStudents.map((s: any) => s.uid));
                                                                }
                                                            }}
                                                        >
                                                            <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>
                                                                {selectedStudentUids.length === batchStudents.length
                                                                    ? 'Deselect All'
                                                                    : 'Select All'}
                                                            </AppText>
                                                        </Pressable>
                                                    </View>
                                                    {batchStudents.map((s: any) => {
                                                        const isSelected = selectedStudentUids.includes(s.uid);
                                                        return (
                                                            <Pressable
                                                                key={s.uid}
                                                                style={[
                                                                    styles.studentRow,
                                                                    isSelected && styles.studentRowSelected,
                                                                ]}
                                                                onPress={() => toggleStudent(s.uid)}
                                                            >
                                                                <View style={[styles.studentAvatar, isSelected && { backgroundColor: colors.primary }]}>
                                                                    <AppText
                                                                        variant="caption"
                                                                        style={{
                                                                            color: isSelected ? colors.surface : colors.primary,
                                                                            fontWeight: '800',
                                                                        }}
                                                                    >
                                                                        {s.full_name?.[0]?.toUpperCase() ?? '?'}
                                                                    </AppText>
                                                                </View>
                                                                <View style={{ flex: 1 }}>
                                                                    <AppText variant="body" style={{ fontWeight: '600' }}>
                                                                        {s.full_name}
                                                                    </AppText>
                                                                    <AppText variant="caption" color={colors.textMuted}>
                                                                        {s.student_id}
                                                                    </AppText>
                                                                </View>
                                                                <View
                                                                    style={[
                                                                        styles.checkbox,
                                                                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                                    ]}
                                                                >
                                                                    {isSelected && (
                                                                        <Ionicons name="checkmark" size={14} color={colors.surface} />
                                                                    )}
                                                                </View>
                                                            </Pressable>
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </>
                                    )}

                                    {/* Submit */}
                                    <Pressable
                                        style={[styles.submitBtn, isSaving && { opacity: 0.6 }]}
                                        onPress={handleSubmit}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator color={colors.surface} />
                                        ) : (
                                            <>
                                                <Ionicons name="add-circle" size={20} color={colors.surface} />
                                                <AppText
                                                    variant="subtitle"
                                                    color={colors.surface}
                                                    style={{ marginLeft: 8, fontWeight: '700' }}
                                                >
                                                    Create Exam Session
                                                </AppText>
                                            </>
                                        )}
                                    </Pressable>

                                    <View style={{ height: 32 }} />
                                </ScrollView>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

/* ── Small reusable helpers ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <AppText variant="caption" style={styles.sectionLabel}>
            {children}
        </AppText>
    );
}

function ChipButton({
    label,
    selected,
    onPress,
    variant = 'primary',
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
    variant?: 'primary' | 'neutral';
}) {
    const bg = selected
        ? variant === 'neutral'
            ? colors.textSecondary
            : colors.primary
        : colors.neutralSoft;
    const textColor = selected ? colors.surface : colors.textSecondary;
    return (
        <Pressable style={[styles.chip, { backgroundColor: bg }]} onPress={onPress}>
            <AppText variant="caption" style={[styles.chipText, { color: textColor }]}>
                {label}
            </AppText>
        </Pressable>
    );
}

/* ── Styles ── */

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.overlayStrong,
    },
    sheetWrapper: {
        maxHeight: '92%',
    },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '100%',
        paddingBottom: Platform.OS === 'ios' ? 24 : 0,
    },
    header: {
        padding: spacing.lg,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        alignItems: 'center',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.divider,
        marginBottom: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 2,
    },
    title: {
        fontWeight: '800',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.neutralSoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        padding: 48,
        alignItems: 'center',
    },
    scrollContent: {
        padding: spacing.lg,
    },
    sectionLabel: {
        fontWeight: '700',
        color: colors.textSecondary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputBox: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 12,
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
    },
    textInput: {
        fontSize: 15,
        color: colors.textPrimary,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    chipRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chipText: {
        fontWeight: '600',
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    typeCard: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
    },
    typeCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '12',
    },
    typeCardText: {
        fontWeight: '600',
        color: colors.textSecondary,
        fontSize: 13,
    },
    dateRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    datePill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.primary + '50',
        backgroundColor: colors.primary + '08',
        gap: 6,
    },
    datePillText: {
        fontSize: 14,
        fontWeight: '600',
    },
    segmentRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
    },
    segmentActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    segmentText: {
        fontWeight: '700',
        color: colors.textMuted,
        fontSize: 13,
    },
    studentSelectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.sm,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
        marginBottom: spacing.xs,
    },
    studentRowSelected: {
        borderColor: colors.primary + '80',
        backgroundColor: colors.primary + '08',
    },
    studentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary + '18',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 14,
        marginTop: spacing.lg,
        elevation: 3,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    emptyMsg: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
});
