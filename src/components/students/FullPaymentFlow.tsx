import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';

import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { useEnrollmentDetails } from '@/src/queries/enrollment.query';
import { colors, spacing } from '@/src/theme';

type Props = {
    enrollmentId: string;
    onConfirmManual: (payload: any) => void;
    confirmLoading?: boolean;
};

export default function FullPaymentFlow({ enrollmentId, onConfirmManual, confirmLoading }: Props) {
    const [subStep, setSubStep] = useState<'selection' | 'link' | 'manual'>('selection');

    const { data: enrollment } = useEnrollmentDetails(enrollmentId);

    // Manual Entry Form State
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');

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
            payment_method: paymentMethod,
            payment_reference: reference,
        };
        onConfirmManual(payload);
    };

    if (subStep === 'selection') {
        return (
            <View style={styles.container}>
                <AppText variant="h3" style={styles.title}>Full Payment Options</AppText>
                <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
                    How would you like to process this payment?
                </AppText>

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
            </View>
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

            <AppSelect
                label="Payment Method"
                value={paymentMethod}
                onSelect={setPaymentMethod}
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
                value={reference}
                onChangeText={setReference}
            />

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
                style={{ marginTop: spacing.xl, marginBottom: spacing.xxl }}
            />
        </ScrollView>
    );
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
});
