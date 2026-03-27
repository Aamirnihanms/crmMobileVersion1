import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import AppButton from '@/src/components/common/AppButton';
import AppLoader from '@/src/components/common/AppLoader';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { useEmiPlans, useEmiPreview } from '@/src/queries/enrollment.query';
import { colors, spacing } from '@/src/theme';

type Props = {
    enrollmentId: string;
    onConfirm: (payload: any) => void;
    confirmLoading?: boolean;
};

export default function EmiPaymentFlow({ enrollmentId, onConfirm, confirmLoading }: Props) {
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { data: emiPlans, isLoading: plansLoading } = useEmiPlans();
    const previewMutation = useEmiPreview();

    const handlePlanSelect = (planId: string) => {
        setSelectedPlanId(planId);
        setErrorMessage(null);
        setShowPreview(false);
        previewMutation.mutate({
            enrollment_id: enrollmentId,
            emi_plan_id: planId,
        }, {
            onSuccess: (data: any) => {
                if (data?.status === 'error') {
                    setErrorMessage(data?.message || 'Failed to generate preview.');
                    setShowPreview(false);
                } else if (data?.emi_preview) {
                    setShowPreview(true);
                } else {
                    setErrorMessage('Invalid response from server.');
                    setShowPreview(false);
                }
            },
            onError: (error: any) => {
                setErrorMessage(
                    error?.response?.data?.message ||
                    error?.message ||
                    'An error occurred while fetching the EMI preview.'
                );
                setShowPreview(false);
            }
        });
    };

    if (plansLoading) return <AppLoader />;

    return (
        <View style={styles.container}>
            <AppSelect
                label="Select EMI Plan"
                placeholder="Choose an EMI plan"
                options={emiPlans?.map(p => ({ label: `${p.name} (${p.installment_count} installments)`, value: p.uid })) || []}
                value={selectedPlanId || ''}
                onSelect={handlePlanSelect}
            />

            {previewMutation.isPending && <AppLoader />}

            {errorMessage && !previewMutation.isPending && (
                <View style={styles.errorContainer}>
                    <AppText color={colors.danger} variant="body">{errorMessage}</AppText>
                </View>
            )}

            {showPreview && !errorMessage && previewMutation.data && (
                <View style={styles.previewSection}>
                    <View style={styles.previewHeader}>
                        <AppText variant="h3" style={styles.previewTitle}>EMI Preview</AppText>
                        <AppText variant="caption" color={colors.textMuted}>Review your installment schedule</AppText>
                    </View>

                    <View style={styles.previewSummary}>
                        <View style={styles.summaryItem}>
                            <AppText variant="caption" color={colors.textMuted}>Plan</AppText>
                            <AppText variant="subtitle" style={{ fontWeight: '700' }}>{previewMutation.data.emi_preview.emi_plan_name}</AppText>
                        </View>
                        <View style={styles.summaryItem}>
                            <AppText variant="caption" color={colors.textMuted}>Total Amount</AppText>
                            <AppText variant="subtitle" style={{ fontWeight: '700', color: colors.primary }}>
                                ₹{previewMutation.data.emi_preview.total_emi_amount}
                            </AppText>
                        </View>
                    </View>

                    <AppText variant="subtitle" style={styles.scheduleTitle}>Installment Schedule</AppText>
                    <ScrollView style={styles.scheduleList} showsVerticalScrollIndicator={false}>
                        {previewMutation.data.installment_breakdown.schedule.map((item) => (
                            <View key={item.installment_number} style={styles.scheduleItem}>
                                <View style={styles.installmentNumber}>
                                    <AppText variant="caption" style={{ fontWeight: '700', color: colors.primary }}>
                                        #{item.installment_number}
                                    </AppText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AppText variant="body" style={{ fontWeight: '600' }}>{item.formatted_due_date}</AppText>
                                    <AppText variant="caption" color={colors.textMuted}>Due Date</AppText>
                                </View>
                                <AppText variant="subtitle" style={{ fontWeight: '700' }}>₹{item.amount}</AppText>
                            </View>
                        ))}
                    </ScrollView>

                    <AppButton
                        title="Confirm EMI Plan"
                        onPress={() => onConfirm(previewMutation.data?.next_steps.required_payload)}
                        loading={confirmLoading}
                        style={styles.confirmButton}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorContainer: {
        backgroundColor: colors.dangerBg,
        padding: spacing.md,
        borderRadius: 8,
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: colors.dangerSoft,
    },
    previewSection: {
        marginTop: spacing.xl,
        flex: 1,
    },
    previewHeader: {
        marginBottom: spacing.lg,
    },
    previewTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
    },
    previewSummary: {
        flexDirection: 'row',
        backgroundColor: colors.primaryLight + '10',
        padding: spacing.lg,
        borderRadius: 16,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.primaryLight + '20',
    },
    summaryItem: {
        flex: 1,
    },
    scheduleTitle: {
        fontWeight: '700',
        marginBottom: spacing.md,
        color: colors.textPrimary,
    },
    scheduleList: {
        flex: 1,
        marginBottom: spacing.xl,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceSubtle,
    },
    installmentNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    confirmButton: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
});
