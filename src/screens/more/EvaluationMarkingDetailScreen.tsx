import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppText from '@/src/components/common/AppText';
import { useMarkSheet, useSaveEvaluationDraft, useSubmitEvaluation, usePublishEvaluation } from '@/src/queries/evaluation.query';
import { colors, spacing } from '@/src/theme';
import { getErrorMessage } from '@/src/utils/error';

export default function EvaluationMarkingDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { attemptUid } = route.params;
    const { data: response, isLoading } = useMarkSheet(attemptUid);
    const { mutate: saveDraft, isPending: isSaving, mutateAsync: saveDraftAsync } = useSaveEvaluationDraft();
    const { mutate: submitEvaluation, isPending: isSubmitting } = useSubmitEvaluation();
    const { mutate: publishEvaluation, isPending: isPublishing } = usePublishEvaluation();
    const markSheet = response?.data;
    const isReadOnly = markSheet?.status?.toLowerCase() === 'published';
 
    const [examAttended, setExamAttended] = useState<boolean | null>(null);
    const [attendanceComment, setAttendanceComment] = useState('');
    const [overallRemarks, setOverallRemarks] = useState('');
    const [scores, setScores] = useState<Record<string, { score_value: string, comment: string }>>({});

    useEffect(() => {
        if (markSheet) {
            console.log('Full MarkSheet Data:', JSON.stringify(markSheet, null, 2));
            setExamAttended(markSheet.exam_attended ?? null);
            setAttendanceComment(markSheet.attendance_comment || '');
            setOverallRemarks(markSheet.remarks || '');
            
            const initialScores: Record<string, { score_value: string, comment: string }> = {};
            if (markSheet.criterion_scores?.length > 0) {
                console.log('Sample Criterion Data:', JSON.stringify(markSheet.criterion_scores[0], null, 2));
            }
            markSheet.criterion_scores?.forEach((criterion: any) => {
                const identifier = criterion.criterion_uid || criterion.uid;
                initialScores[identifier] = {
                    score_value: criterion.score_value ? String(criterion.score_value) : '',
                    comment: criterion.comment || ''
                };
            });
            setScores(initialScores);
        }
    }, [markSheet]);

    const getPayload = () => {
        return {
            exam_attended: !!examAttended,
            attendance_comment: attendanceComment,
            remarks: overallRemarks,
            scores: examAttended ? Object.entries(scores).map(([uid, data]) => ({
                criterion_uid: uid,
                score_value: data.score_value ? parseFloat(data.score_value) : 0,
                comment: data.comment
            })) : []
        };
    };

    const onSaveDraft = () => {
        const payload = getPayload();
        console.log('Saving Draft Payload:', JSON.stringify(payload, null, 2));

        saveDraft({ attemptUid, payload }, {
            onSuccess: () => {
                Alert.alert('Success', 'Draft saved successfully');
            },
            onError: (error: any) => {
                Alert.alert('Error', getErrorMessage(error));
            }
        });
    };

    const onSubmitEvaluation = () => {
        if (examAttended === null) {
            Alert.alert('Error', 'Please confirm if the student attended the exam.');
            return;
        }

        Alert.alert(
            'Submit Evaluation',
            'Are you sure you want to submit this evaluation? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Submit', 
                    onPress: async () => {
                        const payload = getPayload();
                        try {
                            // First call the draft API
                            await saveDraftAsync({ attemptUid, payload });
                            
                            // Then call the submit API
                            submitEvaluation(attemptUid, {
                                onSuccess: () => {
                                    Alert.alert('Success', 'Evaluation submitted successfully', [
                                        { text: 'OK', onPress: () => navigation.goBack() }
                                    ]);
                                },
                                onError: (error: any) => {
                                    Alert.alert('Error', getErrorMessage(error));
                                }
                            });
                        } catch (error: any) {
                            Alert.alert('Error', getErrorMessage(error));
                        }
                    }
                }
            ]
        );
    };

    const onPublishEvaluation = () => {
        Alert.alert(
            'Publish Evaluation',
            'Are you sure you want to publish this evaluation? This will make the results visible to the student.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Publish', 
                    onPress: () => {
                        publishEvaluation(attemptUid, {
                            onSuccess: () => {
                                Alert.alert('Success', 'Evaluation published successfully', [
                                    { text: 'OK', onPress: () => navigation.goBack() }
                                ]);
                            },
                            onError: (error: any) => {
                                Alert.alert('Error', getErrorMessage(error));
                            }
                        });
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!markSheet) {
        return (
            <View style={styles.center}>
                <AppText>Mark sheet not found</AppText>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Student Header */}
            <View style={styles.header}>
                <View style={styles.studentInfo}>
                    <View style={styles.avatar}>
                        <AppText variant="h2" color={colors.primary} style={{ fontWeight: '800' }}>
                            {markSheet.student_name?.[0]?.toUpperCase()}
                        </AppText>
                    </View>
                    <View>
                        <AppText variant="h3" style={styles.studentName}>{markSheet.student_name}</AppText>
                        <AppText variant="body" color={colors.textMuted}>{markSheet.student_id}</AppText>
                    </View>
                </View>
                <View style={styles.batchBadge}>
                    <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>{markSheet.batch_name}</AppText>
                </View>
            </View>

            {/* Exam Info */}
            <AppCard style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <AppText variant="caption" color={colors.textMuted}>Exam</AppText>
                        <AppText variant="body" style={styles.infoValue}>{markSheet.exam_name}</AppText>
                    </View>
                    <View style={styles.infoItem}>
                        <AppText variant="caption" color={colors.textMuted}>Type</AppText>
                        <AppText variant="body" style={styles.infoValue}>{markSheet.exam_type_code || 'FINAL'}</AppText>
                    </View>
                    <View style={styles.infoItem}>
                        <AppText variant="caption" color={colors.textMuted}>Attempt</AppText>
                        <AppText variant="body" style={styles.infoValue}>#{markSheet.attempt_no}</AppText>
                    </View>
                </View>
            </AppCard>

            {/* Attendance Section */}
            <AppCard style={styles.attendanceCard}>
                <AppText variant="subtitle" style={styles.sectionTitle}>Attendance Confirmation</AppText>
                <AppText variant="body" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                    Did the student attend the exam?
                </AppText>
                <View style={styles.attendanceRow}>
                    <Pressable 
                        style={[styles.attendanceOption, examAttended === true && styles.attendanceOptionActive]}
                        onPress={() => !isReadOnly && setExamAttended(true)}
                        disabled={isReadOnly}
                    >
                        <Ionicons name={examAttended === true ? "checkbox" : "square-outline"} size={20} color={examAttended === true ? colors.primary : colors.textMuted} />
                        <AppText style={[{ marginLeft: 8 }, examAttended === true && { color: colors.primary, fontWeight: '700' }]}>Yes</AppText>
                    </Pressable>
                    <Pressable 
                        style={[styles.attendanceOption, examAttended === false && styles.attendanceOptionActiveDanger]}
                        onPress={() => !isReadOnly && setExamAttended(false)}
                        disabled={isReadOnly}
                    >
                        <Ionicons name={examAttended === false ? "checkbox" : "square-outline"} size={20} color={examAttended === false ? colors.danger : colors.textMuted} />
                        <AppText style={[{ marginLeft: 8 }, examAttended === false && { color: colors.danger, fontWeight: '700' }]}>No</AppText>
                    </Pressable>
                </View>

                <AppInput
                    label="Attendance Comment"
                    placeholder="e.g. Late arrival, sick leave..."
                    value={attendanceComment}
                    onChangeText={setAttendanceComment}
                    containerStyle={{ marginTop: spacing.md }}
                    editable={!isReadOnly}
                />
            </AppCard>

            {examAttended === true && (
                <View style={styles.section}>
                    <AppText variant="subtitle" style={styles.sectionTitle}>Evaluation Criteria</AppText>
                    {markSheet.criterion_scores?.map((criterion: any) => (
                        <AppCard key={criterion.uid} style={styles.criterionCard}>
                            <View style={styles.criterionHeader}>
                                <View style={styles.criterionTitleRow}>
                                    <View style={styles.seqBadge}>
                                        <AppText variant="caption" color="white" style={{ fontWeight: '700' }}>{criterion.criterion_sequence_no}</AppText>
                                    </View>
                                    <AppText variant="subtitle" style={styles.criterionName}>{criterion.criterion_name}</AppText>
                                </View>
                                <View style={styles.weightBadge}>
                                    <AppText variant="caption" color={colors.secondary} style={{ fontWeight: '700' }}>
                                        Weight: {parseFloat(criterion.weight_percent).toFixed(0)}%
                                    </AppText>
                                </View>
                            </View>

                            <View style={styles.markingArea}>
                                <View style={styles.inputContainer}>
                                    <AppInput
                                        label={`Score (Max: ${parseFloat(criterion.max_score).toFixed(0)})`}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={scores[criterion.criterion_uid || criterion.uid]?.score_value || ''}
                                        onChangeText={(text) => setScores({ 
                                            ...scores, 
                                            [criterion.criterion_uid || criterion.uid]: { ...scores[criterion.criterion_uid || criterion.uid], score_value: text } 
                                        })}
                                        containerStyle={{ marginBottom: 0 }}
                                        editable={!isReadOnly}
                                    />
                                </View>
                                
                                {criterion.criterion_grade_bands?.length > 0 && (
                                    <View style={styles.gradeBands}>
                                        <AppText variant="caption" color={colors.textMuted} style={styles.gbTitle}>Grade Reference:</AppText>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gbScroll}>
                                            {criterion.criterion_grade_bands.map((gb: any) => (
                                                <View key={gb.uid} style={styles.gbItem}>
                                                    <AppText style={styles.gbLabel}>{gb.label}</AppText>
                                                    <AppText style={styles.gbRange}>{parseFloat(gb.min_score).toFixed(0)}-{parseFloat(gb.max_score).toFixed(0)}</AppText>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                            
                            {criterion.allow_comment && (
                                <AppInput
                                    label="Comments"
                                    placeholder="Add observations..."
                                    multiline
                                    value={scores[criterion.criterion_uid || criterion.uid]?.comment || ''}
                                    onChangeText={(text) => setScores({ 
                                        ...scores, 
                                        [criterion.criterion_uid || criterion.uid]: { ...scores[criterion.criterion_uid || criterion.uid], comment: text } 
                                    })}
                                    containerStyle={{ marginTop: spacing.md, marginBottom: 0 }}
                                    editable={!isReadOnly}
                                />
                            )}
                        </AppCard>
                    ))}

                    <AppCard style={styles.remarksCard}>
                        <AppText variant="subtitle" style={styles.sectionTitle}>Overall Remarks</AppText>
                        <AppInput
                            label="Overall Remarks"
                            placeholder="Final thoughts on student performance..."
                            multiline
                            numberOfLines={4}
                            value={overallRemarks}
                            onChangeText={setOverallRemarks}
                            editable={!isReadOnly}
                            containerStyle={{ marginBottom: 0 }}
                        />
                    </AppCard>
                </View>
            )}

            {!isReadOnly && (
                <View style={styles.footer}>
                    {markSheet?.status?.toLowerCase() === 'submitted' || markSheet?.status?.toLowerCase() === 'completed' ? (
                        <>
                            <AppButton 
                                title="Edit" 
                                variant="outline" 
                                style={styles.actionBtn}
                                onPress={onSaveDraft}
                                loading={isSaving}
                            />
                            <View style={{ width: spacing.md }} />
                            <AppButton 
                                title="Publish" 
                                style={[styles.actionBtn, { flex: 1.5 }]}
                                onPress={onPublishEvaluation}
                                loading={isPublishing}
                                disabled={isSaving}
                            />
                        </>
                    ) : (
                        <>
                            <AppButton 
                                title="Save Draft" 
                                variant="outline" 
                                style={styles.actionBtn}
                                onPress={onSaveDraft}
                                loading={isSaving}
                            />
                            <View style={{ width: spacing.md }} />
                            <AppButton 
                                title="Submit Evaluation" 
                                style={[styles.actionBtn, { flex: 1.5 }]}
                                onPress={onSubmitEvaluation}
                                loading={isSubmitting}
                                disabled={isSaving}
                            />
                        </>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.surface,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    studentName: {
        fontWeight: '800',
    },
    batchBadge: {
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    infoCard: {
        margin: spacing.lg,
        marginTop: 0,
        padding: spacing.lg,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        alignItems: 'center',
    },
    infoValue: {
        fontWeight: '700',
        marginTop: 4,
    },
    section: {
        paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
        fontWeight: '800',
        marginBottom: spacing.md,
        color: colors.textPrimary,
    },
    criterionCard: {
        marginBottom: spacing.lg,
        padding: spacing.lg,
    },
    criterionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    criterionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    seqBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    criterionName: {
        fontWeight: '700',
        flex: 1,
    },
    weightBadge: {
        backgroundColor: colors.secondary + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    markingArea: {
        backgroundColor: colors.neutralSoft,
        borderRadius: 12,
        padding: spacing.md,
    },
    inputContainer: {
        marginBottom: spacing.sm,
    },
    gradeBands: {
        marginTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        paddingTop: spacing.sm,
    },
    gbTitle: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 6,
    },
    gbScroll: {
        flexDirection: 'row',
    },
    gbItem: {
        marginRight: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.divider,
    },
    gbLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    gbRange: {
        fontSize: 10,
        color: colors.textMuted,
    },
    footer: {
        flexDirection: 'row',
        padding: spacing.xl,
        paddingBottom: spacing.xl * 2,
    },
    actionBtn: {
        flex: 1,
    },
    attendanceCard: {
        margin: spacing.lg,
        marginTop: 0,
        padding: spacing.lg,
    },
    attendanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attendanceOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.border,
        marginRight: spacing.md,
        backgroundColor: colors.surface,
    },
    attendanceOptionActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '08',
    },
    attendanceOptionActiveDanger: {
        borderColor: colors.danger,
        backgroundColor: colors.danger + '08',
    },
    remarksCard: {
        marginBottom: spacing.lg,
        padding: spacing.lg,
    },
});
