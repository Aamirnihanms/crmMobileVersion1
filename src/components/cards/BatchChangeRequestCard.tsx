import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';
import { colors, spacing } from '@/src/theme';
import type { BatchChangeRequest } from '@/src/api/batch-change.api';

interface BatchChangeRequestCardProps {
    request: BatchChangeRequest;
    onPress?: () => void;
}

export default function BatchChangeRequestCard({ request, onPress }: BatchChangeRequestCardProps) {
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

    const statusColor = getStatusColor(request.request_info.status, request.request_info.is_expired);
    const initials = request.student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const impactColor = request.fees_impact.impact_type === 'increase' 
        ? colors.danger 
        : request.fees_impact.impact_type === 'decrease' 
            ? colors.success 
            : colors.slate;

    const impactIcon = request.fees_impact.impact_type === 'increase' 
        ? 'trending-up' 
        : request.fees_impact.impact_type === 'decrease' 
            ? 'trending-down' 
            : 'remove';

    return (
        <Pressable onPress={onPress}>
            <AppCard style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <AppText style={styles.avatarText}>{initials}</AppText>
                    </View>
                    <View style={styles.mainInfo}>
                        <View style={styles.requestRow}>
                            <AppText variant="caption" color={colors.textMuted} style={styles.requestNumber}>
                                {request.request_number}
                            </AppText>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
                                <AppText style={[styles.statusBadgeText, { color: statusColor }]}>
                                    {request.request_info.is_expired && request.request_info.status === 'pending' ? 'Expired' : request.request_info.status}
                                </AppText>
                            </View>
                        </View>
                        <AppText variant="subtitle" style={styles.studentName} numberOfLines={1}>
                            {request.student.full_name}
                        </AppText>
                    </View>
                </View>

                <View style={styles.transitionContainer}>
                    <View style={styles.batchInfo}>
                        <AppText variant="caption" color={colors.textMuted}>From Batch</AppText>
                        <AppText variant="body" style={styles.batchName} numberOfLines={1}>{request.change_details.from_batch.name}</AppText>
                    </View>
                    <View style={styles.arrowContainer}>
                        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.batchInfo}>
                        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'right' }}>To Batch</AppText>
                        <AppText variant="body" style={[styles.batchName, { textAlign: 'right' }]} numberOfLines={1}>{request.change_details.to_batch.name}</AppText>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.footer}>
                    <View style={styles.feeImpact}>
                        <Ionicons name={impactIcon as any} size={14} color={impactColor} />
                        <AppText variant="caption" style={[styles.impactText, { color: impactColor }]}>
                            {request.fees_impact.impact_type === 'no_change' ? 'No Fee Change' : `₹${request.fees_impact.fees_difference} ${request.fees_impact.impact_type}`}
                        </AppText>
                    </View>
                    <View style={styles.timeInfo}>
                        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                        <AppText variant="caption" color={colors.textMuted}>
                            {new Date(request.request_info.requested_at).toLocaleDateString()}
                        </AppText>
                    </View>
                </View>
            </AppCard>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.primaryLight + '15',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primaryLight + '30',
    },
    avatarText: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 14,
    },
    mainInfo: {
        flex: 1,
    },
    requestRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    requestNumber: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    studentName: {
        fontWeight: '700',
        fontSize: 15,
        color: colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 0.5,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    transitionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderRadius: 12,
    },
    batchInfo: {
        flex: 1,
    },
    batchName: {
        fontWeight: '600',
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    arrowContainer: {
        paddingHorizontal: spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: colors.surfaceSubtle,
        marginVertical: spacing.md,
        opacity: 0.5,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    feeImpact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    impactText: {
        fontSize: 12,
        fontWeight: '700',
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
});
