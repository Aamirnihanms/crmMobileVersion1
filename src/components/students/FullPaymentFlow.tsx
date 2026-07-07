import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';

import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { useEnrollmentDetails } from '@/src/queries/enrollment.query';
import { colors, spacing } from '@/src/theme';

type PaymentEntry = {
  id: string;
  amount: string;
  payment_method: string;
  payment_reference: string;
};

type Props = {
    enrollmentId: string;
    onConfirmManual: (payload: any) => void;
    confirmLoading?: boolean;
};

let entryCounter = 0;
const createEntry = (): PaymentEntry => {
  entryCounter += 1;
  return { id: `entry_${entryCounter}`, amount: '', payment_method: 'cash', payment_reference: '' };
};

export default function FullPaymentFlow({ enrollmentId, onConfirmManual, confirmLoading }: Props) {
    const [subStep, setSubStep] = useState<'selection' | 'link' | 'manual'>('selection');

    const { data: enrollment } = useEnrollmentDetails(enrollmentId);

    // Manual Entry Form State
    const [payments, setPayments] = useState<PaymentEntry[]>([createEntry()]);
    const [notes, setNotes] = useState('');

    const updatePayment = useCallback((id: string, field: keyof PaymentEntry, value: string) => {
      setPayments(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
    }, []);

    const addPaymentEntry = useCallback(() => {
      setPayments(prev => [...prev, createEntry()]);
    }, []);

    const removePaymentEntry = useCallback((id: string) => {
      setPayments(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev);
    }, []);

    const totalEntryAmount = useMemo(
      () => payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      [payments]
    );

    const generatePaymentLink = () => {
        if (!enrollment) return '';

        const baseUrl = 'https://student.luminartechnolab.com/full-payment-link/';
        const params = new URLSearchParams({
            student_name: enrollment.student_name,
            student_email: enrollment.student_email,
            student_phone: enrollment.student_phone,
        });

        return `${baseUrl}${enrollment.uid}?${params.toString()}`;
    };

    const handleShareLink = async () => {
        const link = generatePaymentLink();
        try {
            await Share.share({
                message: `Please complete your full payment using this link: ${link}`,
                url: link,
            });
        } catch (error: any) {
            Alert.alert('Error', 'Failed to share link');
        }
    };

    const handleManualSubmit = () => {
        const payload = {
            auto_activate: true,
            enrollment_id: enrollmentId,
            notes: notes,
            payment_date: new Date().toISOString(),
            payments: payments.map(p => ({
                amount: parseFloat(p.amount) || 0,
                payment_method: p.payment_method,
                payment_reference: p.payment_reference,
            })),
        };
        onConfirmManual(payload);
    };

    const FinancialSummary = () => {
        if (!enrollment) return null;

        const originalCourseFees = Number(enrollment.original_course_fees) || enrollment.batch?.fee_structure?.course_fees || 0;
        const admissionFees = Number(enrollment.original_admission_fees) || enrollment.batch?.fee_structure?.admission_fees || 0;
        const totalDiscountAmount = Number(enrollment.total_discount_amount) || 0;
        const fullPaymentDiscount = Number(enrollment.original_course_fees_discount) || 0;
        
        const totalFeesAfterDiscount = originalCourseFees - totalDiscountAmount;
        const totalPaid = Number(enrollment.total_amount_paid) || 0;
        const pendingAmount = Number(enrollment.total_pending_amount) || 0;
        
        const amountToPay = Math.max(0, pendingAmount - fullPaymentDiscount);

        return (
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Ionicons name="calculator-outline" size={18} color={colors.primary} />
                    <AppText variant="subtitle" style={styles.summaryTitle}>Financial Details</AppText>
                </View>
                
                <View style={styles.summaryRow}>
                    <AppText variant="caption" color={colors.textMuted}>Course Fees</AppText>
                    <AppText variant="body" style={{ fontWeight: '600' }}>₹{originalCourseFees}</AppText>
                </View>
                
                <View style={styles.summaryRow}>
                    <AppText variant="caption" color={colors.textMuted}>Admission Fees</AppText>
                    <AppText variant="body" style={{ fontWeight: '600' }}>₹{admissionFees}</AppText>
                </View>

                {totalDiscountAmount > 0 && (
                    <View style={styles.summaryRow}>
                        <AppText variant="caption" color={colors.textMuted}>Total Discounts Applied</AppText>
                        <AppText variant="body" color={colors.danger} style={{ fontWeight: '600' }}>- ₹{totalDiscountAmount}</AppText>
                    </View>
                )}

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                    <AppText variant="caption" style={{ fontWeight: '700' }}>Total Fees after Discount</AppText>
                    <AppText variant="body" style={{ fontWeight: '700' }}>₹{totalFeesAfterDiscount}</AppText>
                </View>

                <View style={styles.summaryRow}>
                    <AppText variant="caption" color={colors.textMuted}>Total Paid</AppText>
                    <AppText variant="body" color={colors.successStrong} style={{ fontWeight: '600' }}>₹{totalPaid}</AppText>
                </View>

                <View style={styles.summaryRow}>
                    <AppText variant="caption" color={colors.textMuted}>Balance Amount</AppText>
                    <AppText variant="body" style={{ fontWeight: '600' }}>₹{pendingAmount}</AppText>
                </View>

                {fullPaymentDiscount > 0 && (
                    <View style={[styles.summaryRow, { marginTop: 4 }]}>
                        <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>Full Payment Discount</AppText>
                        <AppText variant="body" color={colors.primary} style={{ fontWeight: '800' }}>- ₹{fullPaymentDiscount}</AppText>
                    </View>
                )}

                <View style={[styles.summaryRow, styles.finalRow]}>
                    <AppText variant="body" style={styles.finalLabel}>Amount to Pay</AppText>
                    <AppText variant="h3" color={colors.primary} style={{ fontWeight: '800' }}>₹{amountToPay}</AppText>
                </View>
            </View>
        );
    };

    if (subStep === 'selection') {
        return (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <AppText variant="h3" style={styles.title}>Full Payment Options</AppText>
                <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
                    How would you like to process this payment?
                </AppText>

                <FinancialSummary />

                <TouchableOpacity style={styles.optionCard} onPress={() => setSubStep('link')}>
                    <View style={[styles.iconBox, { backgroundColor: colors.info + '15' }]}>
                        <Ionicons name="link-outline" size={24} color={colors.info} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppText variant="subtitle" style={{ fontWeight: '700' }}>Payment Link</AppText>
                        <AppText variant="caption" color={colors.textMuted}>Generate and share a link with the student</AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionCard} onPress={() => setSubStep('manual')}>
                    <View style={[styles.iconBox, { backgroundColor: colors.success + '15' }]}>
                        <Ionicons name="create-outline" size={24} color={colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppText variant="subtitle" style={{ fontWeight: '700' }}>Manual Entry</AppText>
                        <AppText variant="caption" color={colors.textMuted}>Log a payment received offline</AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </ScrollView>
        );
    }

    if (subStep === 'link') {
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => setSubStep('selection')}>
                    <Ionicons name="arrow-back" size={20} color={colors.primary} />
                    <AppText variant="body" color={colors.primary} style={{ fontWeight: '600', marginLeft: 4 }}>
                        Back to Options
                    </AppText>
                </TouchableOpacity>

                <AppText variant="h3" style={styles.title}>Payment Link</AppText>
                <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
                    Share this link with the student to collect payment online
                </AppText>

                <View style={styles.linkCard}>
                    <AppText variant="body" style={styles.linkText} numberOfLines={3}>
                        {generatePaymentLink()}
                    </AppText>
                </View>

                <AppButton
                    title="Share Link"
                    onPress={handleShareLink}
                    variant="primary"
                    style={{ marginTop: spacing.lg }}
                />
            </View>
        );
    }

    if (subStep === 'manual') {
        const amountToPay = Math.max(0, (Number(enrollment?.total_pending_amount) || 0) - (Number(enrollment?.original_course_fees_discount) || 0));
        const totalFormatted = totalEntryAmount.toLocaleString('en-IN');
        const targetFormatted = amountToPay.toLocaleString('en-IN');
        const isOver = totalEntryAmount > amountToPay;
        const isUnder = totalEntryAmount > 0 && totalEntryAmount < amountToPay;
        const isExact = totalEntryAmount > 0 && totalEntryAmount === amountToPay;

        return (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => setSubStep('selection')}>
                    <Ionicons name="arrow-back" size={20} color={colors.primary} />
                    <AppText variant="body" color={colors.primary} style={{ fontWeight: '600', marginLeft: 4 }}>
                        Back to Options
                    </AppText>
                </TouchableOpacity>

                <AppText variant="h3" style={styles.title}>Manual Payment Entry</AppText>
                <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
                    Enter the details of the payment received
                </AppText>

                <FinancialSummary />

                <View style={styles.paymentsSection}>
                    <AppText variant="subtitle" style={styles.paymentsSectionTitle}>Payment Splits</AppText>

                    {payments.map((entry, index) => (
                        <View key={entry.id} style={styles.paymentEntryCard}>
                            <View style={styles.paymentEntryHeader}>
                                <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '600' }}>
                                    Payment #{index + 1}
                                </AppText>
                                {payments.length > 1 && (
                                    <TouchableOpacity onPress={() => removePaymentEntry(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Ionicons name="remove-circle-outline" size={22} color={colors.danger} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <AppInput
                                label="Amount"
                                placeholder="Enter amount"
                                value={entry.amount}
                                onChangeText={(v) => updatePayment(entry.id, 'amount', v)}
                                keyboardType="numeric"
                            />

                            <AppSelect
                                label="Payment Method"
                                value={entry.payment_method}
                                onSelect={(v) => updatePayment(entry.id, 'payment_method', v)}
                                options={[
                                    { label: 'Cash', value: 'cash' },
                                    { label: 'UPI', value: 'upi' },
                                    { label: 'Bank Transfer', value: 'bank_transfer' },
                                    { label: 'Card', value: 'card' },
                                    { label: 'Cheque', value: 'cheque' },
                                ]}
                            />

                            <AppInput
                                label="Payment Reference (Optional)"
                                placeholder="Transaction ID, Receipt No, etc."
                                value={entry.payment_reference}
                                onChangeText={(v) => updatePayment(entry.id, 'payment_reference', v)}
                            />
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addPaymentButton} onPress={addPaymentEntry}>
                        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                        <AppText variant="body" color={colors.primary} style={{ fontWeight: '600', marginLeft: 8 }}>
                            Add Another Payment Method
                        </AppText>
                    </TouchableOpacity>

                    {totalEntryAmount > 0 && (
                        <View style={[styles.totalBar, isOver && styles.totalBarOver, isExact && styles.totalBarExact]}>
                            <AppText variant="body" style={{ fontWeight: '700' }}>
                                Total: ₹{totalFormatted}
                            </AppText>
                            <AppText variant="caption" style={{ fontWeight: '600' }}>
                                {isExact
                                    ? '✓ Matches amount to pay'
                                    : isOver
                                        ? `⚠ Exceeds by ₹{(totalEntryAmount - amountToPay).toLocaleString('en-IN')}`
                                        : `of ₹${targetFormatted}`}
                            </AppText>
                        </View>
                    )}

                    {totalEntryAmount > 0 && !isExact && (
                        <View style={styles.errorBar}>
                            <Ionicons name="alert-circle" size={16} color={colors.danger} />
                            <AppText variant="caption" color={colors.danger} style={{ marginLeft: 6, flex: 1 }}>
                                {isOver
                                    ? `Total exceeds amount to pay by ₹${(totalEntryAmount - amountToPay).toLocaleString('en-IN')}`
                                    : `Total is ₹${(amountToPay - totalEntryAmount).toLocaleString('en-IN')} short of the amount to pay`}
                            </AppText>
                        </View>
                    )}
                </View>

                <AppInput
                    label="Notes (Optional)"
                    placeholder="Additional details..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    style={{ height: 100, textAlignVertical: 'top' }}
                />

                <AppButton
                    title="Complete Full Payment"
                    onPress={handleManualSubmit}
                    loading={confirmLoading}
                    disabled={!isExact}
                    style={{ marginTop: spacing.xl, marginBottom: spacing.xxl }}
                />
            </ScrollView>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        marginBottom: spacing.xl,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: 20,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.surfaceSubtle,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    linkCard: {
        padding: spacing.lg,
        backgroundColor: colors.background,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.primaryLight,
    },
    linkText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontFamily: 'monospace',
    },
    summaryCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: 24,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.surfaceSubtle,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.lg,
    },
    summaryTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: colors.surfaceSubtle,
        marginVertical: spacing.md,
    },
    finalRow: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceSubtle,
        borderStyle: 'dashed',
    },
    finalLabel: {
        fontWeight: '700',
        fontSize: 16,
    },
    paymentsSection: {
        marginBottom: spacing.lg,
    },
    paymentsSectionTitle: {
        fontWeight: '700',
        marginBottom: spacing.md,
    },
    paymentEntryCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: 20,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.surfaceSubtle,
    },
    paymentEntryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    addPaymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: colors.primaryLight,
        backgroundColor: colors.primaryLight + '08',
        marginBottom: spacing.md,
    },
    totalBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 16,
        backgroundColor: colors.info + '12',
        marginBottom: spacing.md,
    },
    totalBarOver: {
        backgroundColor: colors.danger + '15',
    },
    totalBarExact: {
        backgroundColor: colors.success + '15',
    },
    errorBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 16,
        backgroundColor: colors.danger + '12',
        marginBottom: spacing.md,
    },
});
