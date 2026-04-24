import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
    Alert,
    Modal,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import AppText from '../../components/common/AppText';
import AppLoader from '../../components/common/AppLoader';
import AppCard from '../../components/common/AppCard';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import { colors, spacing } from '@/src/theme';
import { useBatchChangeRequestDetail, useApproveBatchChangeRequest } from '../../queries/batch-change.query';
import { MoreStackParamList } from '../../navigation/MoreStack';

const { width } = Dimensions.get('window');

export default function BatchChangeRequestDetailScreen() {
    const route = useRoute<RouteProp<MoreStackParamList, 'BatchChangeRequestDetail'>>();
    const { uid } = route.params;

    const { data: response, isLoading, isError, refetch } = useBatchChangeRequestDetail(uid);
    const data = response?.data;

    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [currentAction, setCurrentAction] = useState<'process' | 'reject'>('process');
    const [notes, setNotes] = useState('');
    const [processingNotes, setProcessingNotes] = useState('');

    const actionMutation = useApproveBatchChangeRequest();

    const closeModal = () => {
        Keyboard.dismiss();
        setActionModalVisible(false);
    };

    const handleConfirmAction = () => {
        if (!notes.trim()) {
            Alert.alert('Error', 'Notes are mandatory.');
            return;
        }

        actionMutation.mutate({
            uid,
            payload: {
                action: currentAction,
                notes,
                processing_notes: processingNotes || undefined,
            }
        }, {
            onSuccess: () => {
                const actionLabel = currentAction === 'process' ? 'approved' : 'cancelled';
                Alert.alert('Success', `Request ${actionLabel} successfully.`);
                closeModal();
                setNotes('');
                setProcessingNotes('');
            },
            onError: (error: any) => {
                const msg = error?.response?.data?.message || `Failed to ${currentAction === 'process' ? 'approve' : 'cancel'} request.`;
                Alert.alert('Error', msg);
            }
        });
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <AppLoader />
                <AppText style={{ marginTop: spacing.md }}>Fetching request details...</AppText>
            </View>
        );
    }

    if (isError || !data) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
                <AppText variant="h3" style={{ marginTop: spacing.md }}>Oops!</AppText>
                <AppText color={colors.textMuted}>Failed to load request info.</AppText>
                <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                    <AppText color={colors.primary}>Try Again</AppText>
                </Pressable>
            </View>
        );
    }

    const getStatusColor = (status: string, isExpired: boolean) => {
        if (isExpired && status === 'pending') return colors.danger;
        switch (status.toLowerCase()) {
            case 'pending': return colors.warning;
            case 'processed': return colors.success;
            case 'approved': return colors.info;
            case 'rejected': return colors.danger;
            default: return colors.slate;
        }
    };

    const statusColor = getStatusColor(data.request_info.status, data.request_info.is_expired);
    const initials = data.student_info.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const InfoRow = ({ label, value, icon, color = colors.textPrimary }: any) => (
        <View style={styles.infoRow}>
            {icon && <Ionicons name={icon} size={16} color={colors.textMuted} style={styles.infoIcon} />}
            <View style={styles.infoTextContainer}>
                <AppText variant="caption" color={colors.textMuted} style={styles.infoLabel}>{label}</AppText>
                <AppText style={[styles.infoValue, { color }]}>{value || 'N/A'}</AppText>
            </View>
        </View>
    );

    const ComparisonItem = ({ label, current, requested, icon }: any) => (
        <View style={styles.comparisonItem}>
            <View style={styles.comparisonLabelRow}>
                <Ionicons name={icon} size={14} color={colors.primary} />
                <AppText variant="caption" style={styles.comparisonLabel}>{label}</AppText>
            </View>
            <View style={styles.comparisonValues}>
                <View style={styles.comparisonHalf}>
                    <AppText variant="caption" color={colors.textMuted}>Current</AppText>
                    <AppText style={styles.comparisonValueText}>{current}</AppText>
                </View>
                <View style={styles.comparisonArrow}>
                    <Ionicons name="arrow-forward" size={16} color={colors.primaryLight} />
                </View>
                <View style={styles.comparisonHalf}>
                    <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'right' }}>Requested</AppText>
                    <AppText style={[styles.comparisonValueText, { textAlign: 'right', color: colors.primary }]}>{requested}</AppText>
                </View>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={[colors.primary, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                />
                <View style={styles.headerContent}>
                    <View style={styles.avatar}>
                        <AppText style={styles.avatarText}>{initials}</AppText>
                    </View>
                    <View style={styles.headerInfo}>
                        <View style={styles.headerLabels}>
                            <AppText variant="h2" color={colors.surface} style={styles.requestNum}>
                                {data.request_info.request_number}
                            </AppText>
                            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <AppText style={styles.statusText}>
                                    {data.request_info.is_expired && data.request_info.status === 'pending' ? 'EXPIRED' : data.request_info.status.toUpperCase()}
                                </AppText>
                            </View>
                        </View>
                        <AppText variant="subtitle" color="rgba(255,255,255,0.9)">{data.student_info.full_name}</AppText>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                {/* Transfer Overview */}
                <AppText variant="h3" style={styles.sectionTitle}>Transfer Overview</AppText>
                <AppCard style={styles.card}>
                    <ComparisonItem 
                        label="Batch" 
                        current={data.current_enrollment.batch_name} 
                        requested={data.requested_batch.batch_name}
                        icon="layers-outline"
                    />
                    <View style={styles.cardDivider} />
                    <ComparisonItem 
                        label="Course" 
                        current={data.current_enrollment.course_name} 
                        requested={data.requested_batch.course_name}
                        icon="school-outline"
                    />
                    <View style={styles.cardDivider} />
                    <ComparisonItem 
                        label="Attendance Mode" 
                        current={data.current_enrollment.attendance_mode.name} 
                        requested={data.change_request_details.requested_attendance_mode.name}
                        icon="walk-outline"
                    />
                </AppCard>

                {/* Financial Analysis */}
                <AppText variant="h3" style={styles.sectionTitle}>Financial Analysis</AppText>
                <AppCard style={styles.card}>
                    <View style={styles.feeHeaders}>
                        <View style={{ flex: 1.5 }}><AppText variant="caption" color={colors.textMuted}>DESCRIPTION</AppText></View>
                        <View style={{ flex: 1 }}><AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'right' }}>CURRENT</AppText></View>
                        <View style={{ flex: 1 }}><AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'right' }}>NEW</AppText></View>
                    </View>
                    
                    <View style={styles.feeRow}>
                        <View style={{ flex: 1.5 }}><AppText style={styles.feeLabel}>Course Fees</AppText></View>
                        <View style={{ flex: 1 }}><AppText style={styles.feeVal}>₹{data.fees_analysis.current_course_fees.toLocaleString()}</AppText></View>
                        <View style={{ flex: 1 }}><AppText style={styles.feeVal}>₹{data.fees_analysis.new_course_fees.toLocaleString()}</AppText></View>
                    </View>
                    <View style={styles.feeRow}>
                        <View style={{ flex: 1.5 }}><AppText style={styles.feeLabel}>Admission Fees</AppText></View>
                        <View style={{ flex: 1 }}><AppText style={styles.feeVal}>₹{data.fees_analysis.current_admission_fees.toLocaleString()}</AppText></View>
                        <View style={{ flex: 1 }}><AppText style={styles.feeVal}>₹{data.fees_analysis.new_admission_fees.toLocaleString()}</AppText></View>
                    </View>
                    
                    <View style={styles.feesDivider} />
                    
                    <View style={styles.feeRowTotal}>
                        <View style={{ flex: 1.5 }}><AppText style={styles.totalLabel}>Total Impact</AppText></View>
                        <View style={{ flex: 1 }}><AppText style={styles.totalVal}>₹{data.fees_analysis.current_total.toLocaleString()}</AppText></View>
                        <View style={{ flex: 1 }}><AppText style={[styles.totalVal, { color: colors.primary }]}>₹{data.fees_analysis.new_total.toLocaleString()}</AppText></View>
                    </View>

                    <View style={[styles.impactBadge, { backgroundColor: data.fees_analysis.impact_type === 'increase' ? colors.dangerBg : colors.successBg }]}>
                        <Ionicons 
                            name={data.fees_analysis.impact_type === 'increase' ? 'trending-up' : 'trending-down'} 
                            size={16} 
                            color={data.fees_analysis.impact_type === 'increase' ? colors.danger : colors.success} 
                        />
                        <AppText style={[styles.impactText, { color: data.fees_analysis.impact_type === 'increase' ? colors.danger : colors.success }]}>
                            {data.fees_analysis.impact_type === 'no_change' ? 'No Change' : `${formatLabel(data.fees_analysis.impact_type)} of ₹${data.fees_analysis.fees_difference.toLocaleString()}`}
                        </AppText>
                    </View>
                </AppCard>

                {/* Additional Details */}
                <AppText variant="h3" style={styles.sectionTitle}>Request Details</AppText>
                <AppCard style={styles.card}>
                    <InfoRow label="Reason for Change" value={data.request_info.reason} icon="help-circle-outline" />
                    <View style={styles.cardDivider} />
                    <InfoRow label="Remarks" value={data.request_info.remarks} icon="chatbubble-outline" />
                    <View style={styles.cardDivider} />
                    <View style={styles.multiRow}>
                        <InfoRow label="Priority" value={data.request_info.priority.toUpperCase()} icon="flag-outline" color={data.request_info.priority === 'high' ? colors.danger : colors.textPrimary} />
                        <InfoRow label="Requested By" value={data.workflow_info.requested_by} icon="person-outline" />
                    </View>
                    <View style={styles.cardDivider} />
                    <InfoRow label="Expires At" value={new Date(data.request_info.expires_at).toLocaleString()} icon="time-outline" color={data.request_info.is_expired ? colors.danger : colors.textPrimary} />
                </AppCard>

                {/* Activity Logs */}
                <AppText variant="h3" style={styles.sectionTitle}>Timeline</AppText>
                <AppCard style={[styles.card, { paddingBottom: spacing.lg }]}>
                    {data.activity_logs.map((log, index) => (
                        <View key={index} style={styles.timelineItem}>
                            <View style={styles.timelineSide}>
                                <View style={[styles.timelineDot, { backgroundColor: index === 0 ? colors.primary : colors.border }]} />
                                {index < data.activity_logs.length - 1 && <View style={styles.timelineLine} />}
                            </View>
                            <View style={styles.timelineContent}>
                                <AppText style={styles.logTitle}>{log.title}</AppText>
                                <AppText variant="caption" color={colors.textSecondary} style={styles.logDesc}>{log.description}</AppText>
                                <View style={styles.logFooter}>
                                    <Ionicons name="person-circle-outline" size={12} color={colors.textMuted} />
                                    <AppText style={styles.logBy}>{log.performed_by}</AppText>
                                    <AppText style={styles.logTime}> • {new Date(log.created_at).toLocaleDateString()}</AppText>
                                </View>
                            </View>
                        </View>
                    ))}
                </AppCard>

                <View style={{ height: 100 }} />
            </View>
        </ScrollView>
        {(() => {
            const actions = data?.actions_available;
            if (!actions) return null;
            const hasActions = actions.can_approve || actions.can_process || actions.can_cancel;
            if (!hasActions) return null;

            return (
                <View style={styles.actionBar}>
                    {actions.can_cancel && (
                        <AppButton 
                            title="Cancel Request" 
                            variant="outline" 
                            onPress={() => {
                                setCurrentAction('reject');
                                setActionModalVisible(true);
                            }} 
                            style={[styles.actionBtn, { borderColor: colors.danger }]}
                            textStyle={{ color: colors.danger }}
                        />
                    )}
                    {actions.can_approve && (
                        <AppButton 
                            title="Approve" 
                            onPress={() => {
                                setCurrentAction('process');
                                setActionModalVisible(true);
                            }} 
                            style={styles.actionBtn}
                        />
                    )}
                    {actions.can_process && (
                        <AppButton 
                            title="Process" 
                            onPress={() => {}} 
                            style={styles.actionBtn}
                        />
                    )}
                </View>
            );
        })()}

        {/* Action Modal (Approve / Reject) */}
        <Modal visible={actionModalVisible} transparent animationType="slide">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                    <AppCard style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h3" style={{ fontWeight: '800' }}>
                                {currentAction === 'process' ? 'Confirm Approval' : 'Confirm Cancellation'}
                            </AppText>
                            <Pressable onPress={closeModal}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </Pressable>
                        </View>

                        <View style={styles.modalBody}>
                            <AppInput 
                                label={`Notes (${currentAction === 'process' ? 'Approval' : 'Reason'})`} 
                                placeholder="Enter notes..." 
                                value={notes} 
                                onChangeText={setNotes} 
                                multiline 
                                numberOfLines={3}
                            />
                            <AppInput 
                                label="Processing Notes (Optional)" 
                                placeholder="Enter additional processing info..." 
                                value={processingNotes} 
                                onChangeText={setProcessingNotes} 
                                multiline 
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <AppButton 
                                title="Back" 
                                variant="outline" 
                                onPress={closeModal} 
                                style={{ flex: 1 }}
                            />
                            <AppButton 
                                title={currentAction === 'process' ? 'Confirm Approve' : 'Confirm Cancel'} 
                                onPress={handleConfirmAction} 
                                loading={actionMutation.isPending}
                                variant={currentAction === 'reject' ? 'danger' : 'primary'}
                                style={{ flex: 1.5 }}
                            />
                        </View>
                    </AppCard>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    </View>
    );
}

const formatLabel = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
    header: {
        height: 180,
        position: 'relative',
    },
    headerGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    headerContent: {
        paddingTop: 60,
        paddingHorizontal: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.primary,
    },
    headerInfo: {
        marginLeft: spacing.lg,
        flex: 1,
    },
    headerLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: 4,
    },
    requestNum: {
        fontWeight: '800',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        color: colors.surface,
        fontSize: 10,
        fontWeight: '800',
    },
    content: {
        padding: spacing.lg,
        marginTop: -30,
    },
    sectionTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: spacing.md,
        marginTop: spacing.xl,
        marginLeft: 4,
    },
    card: {
        borderRadius: 24,
        padding: spacing.lg,
        marginBottom: 0,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoIcon: {
        marginTop: 10,
        marginRight: spacing.md,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        textTransform: 'uppercase',
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    infoValue: {
        fontWeight: '600',
        fontSize: 15,
        lineHeight: 22,
    },
    cardDivider: {
        height: 1,
        backgroundColor: colors.surfaceSubtle,
        marginVertical: spacing.md,
    },
    multiRow: {
        flexDirection: 'row',
        gap: spacing.lg,
    },
    comparisonItem: {
        marginBottom: 4,
    },
    comparisonLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    comparisonLabel: {
        fontWeight: '700',
        color: colors.textPrimary,
    },
    comparisonValues: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: 16,
    },
    comparisonHalf: {
        flex: 1,
    },
    comparisonArrow: {
        paddingHorizontal: spacing.md,
    },
    comparisonValueText: {
        fontWeight: '700',
        fontSize: 13,
        marginTop: 2,
        color: colors.textSecondary,
    },
    feeHeaders: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        paddingHorizontal: 4,
    },
    feeRow: {
        flexDirection: 'row',
        paddingVertical: spacing.sm,
        paddingHorizontal: 4,
    },
    feeLabel: {
        fontWeight: '600',
        color: colors.textSecondary,
    },
    feeVal: {
        textAlign: 'right',
        fontWeight: '600',
        color: colors.textPrimary,
    },
    feesDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
        borderStyle: 'dashed',
    },
    feeRowTotal: {
        flexDirection: 'row',
        paddingVertical: spacing.sm,
        paddingHorizontal: 4,
        marginBottom: spacing.md,
    },
    totalLabel: {
        fontWeight: '800',
        color: colors.textPrimary,
        fontSize: 15,
    },
    totalVal: {
        textAlign: 'right',
        fontWeight: '800',
        fontSize: 15,
    },
    impactBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    impactText: {
        fontWeight: '800',
        fontSize: 13,
    },
    timelineItem: {
        flexDirection: 'row',
    },
    timelineSide: {
        width: 20,
        alignItems: 'center',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 6,
        zIndex: 1,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: colors.border,
        marginVertical: -2,
    },
    timelineContent: {
        flex: 1,
        paddingLeft: spacing.md,
        paddingBottom: spacing.xl,
    },
    logTitle: {
        fontWeight: '700',
        fontSize: 15,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    logDesc: {
        lineHeight: 18,
    },
    logFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    logBy: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
        marginLeft: 4,
    },
    logTime: {
        fontSize: 11,
        color: colors.textMuted,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        flexDirection: 'row',
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    actionBtn: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        padding: spacing.xl,
        borderRadius: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalBody: {
        gap: spacing.md,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xl,
    },
});
