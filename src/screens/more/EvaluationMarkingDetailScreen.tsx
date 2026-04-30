import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppText from '@/src/components/common/AppText';
import { useMarkSheet } from '@/src/queries/evaluation.query';
import { colors, spacing } from '@/src/theme';

export default function EvaluationMarkingDetailScreen() {
    const route = useRoute<any>();
    const { attemptUid } = route.params;
    const { data: response, isLoading } = useMarkSheet(attemptUid);
    const markSheet = response?.data;

    const [scores, setScores] = useState<Record<string, string>>({});

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

            {/* Criteria List */}
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
                                    value={scores[criterion.uid] || String(criterion.score_value || '')}
                                    onChangeText={(text) => setScores({ ...scores, [criterion.uid]: text })}
                                    containerStyle={{ marginBottom: 0 }}
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
                                containerStyle={{ marginTop: spacing.md }}
                            />
                        )}
                    </AppCard>
                ))}
            </View>

            <View style={styles.footer}>
                <AppButton 
                    title="Save Draft" 
                    variant="outline" 
                    style={styles.actionBtn}
                    onPress={() => {}}
                />
                <View style={{ width: spacing.md }} />
                <AppButton 
                    title="Submit Evaluation" 
                    style={[styles.actionBtn, { flex: 1.5 }]}
                    onPress={() => {}}
                />
            </View>
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
});
