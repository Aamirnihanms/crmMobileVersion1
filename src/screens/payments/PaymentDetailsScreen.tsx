import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import { useDownloadReceipt, usePaymentTransactionDetails } from '@/src/queries/payments.query';
import { colors, spacing } from '@/src/theme';

function DetailRow({ label, value, icon, isLast = false, onValuePress }: {
    label: string;
    value: string | null | undefined;
    icon?: keyof typeof Ionicons.glyphMap;
    isLast?: boolean;
    onValuePress?: () => void;
}) {
    if (!value) return null;
    return (
        <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
            <View style={styles.detailLabelRow}>
                {icon && <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginRight: 8 }} />}
                <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '600' }}>{label}</AppText>
            </View>
            <Pressable onPress={onValuePress} disabled={!onValuePress}>
                <AppText variant="subtitle" style={[styles.detailValue, onValuePress && { color: colors.primary }]}>
                    {value}
                </AppText>
            </Pressable>
        </View>
    );
}

export default function PaymentDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { uid } = route.params;
    const [isDownloading, setIsDownloading] = useState(false);

    const { data: transaction, isLoading, isError, error, refetch } = usePaymentTransactionDetails(uid);
    const downloadMutation = useDownloadReceipt();

    const handleDownloadReceipt = async () => {
        if (!transaction) return;

        try {
            setIsDownloading(true);
            const receipt = await downloadMutation.mutateAsync(transaction.transaction_id);

            if (!receipt.pdf_file) {
                throw new Error('Receipt PDF URL not found');
            }

            const fileName = `Receipt_${receipt.receipt_number}.pdf`;
            const fileUri = FileSystem.cacheDirectory + fileName;

            const downloadResult = await FileSystem.downloadAsync(receipt.pdf_file, fileUri);

            if (downloadResult.status !== 200) {
                throw new Error('Failed to download PDF');
            }

            // Simplified download: Just use sharing to pop up the share sheet
            // This allows users to "Save to Files" or other apps easily on both platforms
            await Sharing.shareAsync(downloadResult.uri);
        } catch (err: any) {
            Alert.alert('Download Failed', err.message || 'Unable to download receipt');
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) return <AppLoader />;

    if (isError || !transaction) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                <AppText color={colors.danger} style={{ marginTop: spacing.md }}>
                    {(error as Error)?.message || 'Failed to load transaction details'}
                </AppText>
                <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                    <AppText color={colors.primary}>Try Again</AppText>
                </Pressable>
            </View>
        );
    }

    const isCompleted = transaction.status === 'completed';
    const isFailed = transaction.status === 'failed';
    const statusColor = isCompleted ? colors.success : isFailed ? colors.danger : colors.warning;

    const formattedDate = new Date(transaction.payment_date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
                {/* Header Card */}
                <AppCard style={styles.headerCard}>
                    <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    />
                    <View style={styles.headerContent}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <AppText variant="caption" color={colors.surface} style={{ fontWeight: '700' }}>
                                    {transaction.status_display}
                                </AppText>
                            </View>
                            <AppText variant="caption" color="rgba(255,255,255,0.7)">{transaction.transaction_id}</AppText>
                        </View>
                        <View style={styles.amountContainer}>
                            <AppText variant="h1" color={colors.surface} style={styles.amountText}>
                                ₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
                            </AppText>
                            <AppText variant="caption" color="rgba(255,255,255,0.8)">{transaction.payment_method_display}</AppText>
                        </View>
                    </View>
                </AppCard>

                {/* Download Button - Fixed to only show if NOT failed */}
                {!isFailed && (
                    <Pressable
                        style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
                        onPress={handleDownloadReceipt}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <ActivityIndicator color={colors.surface} size="small" />
                        ) : (
                            <Ionicons name="download-outline" size={20} color={colors.surface} />
                        )}
                        <AppText color={colors.surface} style={styles.downloadButtonText}>
                            {isDownloading ? 'Downloading...' : 'Download Receipt'}
                        </AppText>
                    </Pressable>
                )}

                {/* Enrollment & Student Details */}
                {transaction.enrollment_details && (
                    <>
                        <AppText variant="h3" style={styles.sectionTitle}>Enrollment Details</AppText>
                        <AppCard style={styles.infoCard}>
                            <DetailRow
                                label="Student Name"
                                value={transaction.enrollment_details?.student_name || 'N/A'}
                                icon="person-outline"
                            />
                            <DetailRow
                                label="Student ID"
                                value={transaction.student_id}
                                icon="id-card-outline"
                            />
                            <DetailRow
                                label="Email"
                                value={transaction.enrollment_details?.student_email}
                                icon="mail-outline"
                                onValuePress={transaction.enrollment_details?.student_email ? () => Linking.openURL(`mailto:${transaction.enrollment_details?.student_email}`) : undefined}
                            />
                            <DetailRow
                                label="Phone"
                                value={transaction.enrollment_details?.student_phone}
                                icon="call-outline"
                                onValuePress={transaction.enrollment_details?.student_phone ? () => Linking.openURL(`tel:${transaction.enrollment_details?.student_phone}`) : undefined}
                            />
                            <DetailRow
                                label="Course"
                                value={transaction.enrollment_details?.course_name}
                                icon="book-outline"
                            />
                            <DetailRow
                                label="Batch"
                                value={transaction.enrollment_details?.batch_name}
                                icon="people-outline"
                                isLast
                            />
                        </AppCard>
                    </>
                )}

                {/* Payment Particulars */}
                <AppText variant="h3" style={styles.sectionTitle}>Payment Information</AppText>
                <AppCard style={styles.infoCard}>
                    <DetailRow
                        label="Payment Date & Time"
                        value={formattedDate}
                        icon="calendar-outline"
                    />
                    <DetailRow
                        label="Payment Method"
                        value={transaction.payment_method_display}
                        icon="wallet-outline"
                    />
                    <DetailRow
                        label="Reference Number"
                        value={transaction.reference_number || 'N/A'}
                        icon="receipt-outline"
                    />
                    {transaction.gateway_transaction_id && (
                        <DetailRow
                            label="Gateway TXN ID"
                            value={transaction.gateway_transaction_id}
                            icon="card-outline"
                        />
                    )}
                    <DetailRow
                        label="Collected By"
                        value={transaction?.counselor_details?.name}
                        icon="person-circle-outline"
                        isLast
                    />
                </AppCard>

                {/* Notes */}
                {transaction.notes && (
                    <>
                        <AppText variant="h3" style={styles.sectionTitle}>Notes</AppText>
                        <AppCard style={[styles.infoCard, styles.notesCard]}>
                            <Ionicons name="document-text-outline" size={20} color={colors.textMuted} style={{ marginBottom: 8 }} />
                            <AppText variant="body" color={colors.textPrimary}>{transaction.notes}</AppText>
                        </AppCard>
                    </>
                )}

                <View style={{ height: spacing.xl * 2 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        padding: spacing.lg,
    },
    headerCard: {
        padding: 0,
        borderRadius: 28,
        marginBottom: spacing.xl,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    headerContent: {
        padding: spacing.xl,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    amountContainer: {
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    amountText: {
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 4,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: 16,
        marginBottom: spacing.xl,
        gap: spacing.sm,
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    downloadButtonDisabled: {
        opacity: 0.7,
        backgroundColor: colors.textMuted,
    },
    downloadButtonText: {
        fontWeight: '700',
        fontSize: 16,
    },
    sectionTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: spacing.md,
        marginLeft: 4,
    },
    infoCard: {
        padding: spacing.lg,
        borderRadius: 20,
        backgroundColor: colors.surface,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.surfaceSubtle,
    },
    detailRow: {
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceSubtle,
    },
    detailLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailValue: {
        fontWeight: '700',
        color: colors.textPrimary,
    },
    notesCard: {
        padding: spacing.lg,
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
});
