import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';
import { colors, spacing } from '@/src/theme';
import type { Batch } from '@/src/api/batches.api';

interface BatchCardProps {
    batch: Batch;
    onPress?: () => void;
}

export default function BatchCard({ batch, onPress }: BatchCardProps) {
    const statusColor = batch.is_active ? colors.success : colors.danger;
    const initials = batch.batch_name.slice(0, 2).toUpperCase();

    return (
        <Pressable onPress={onPress}>
            <AppCard style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <AppText style={styles.avatarText}>{initials}</AppText>
                    </View>
                    <View style={styles.mainInfo}>
                        <View style={styles.nameRow}>
                            <AppText variant="subtitle" style={styles.name} numberOfLines={1}>
                                {batch.batch_name}
                            </AppText>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
                                <AppText style={[styles.statusBadgeText, { color: statusColor }]}>
                                    {batch.is_active ? 'Active' : 'Inactive'}
                                </AppText>
                            </View>
                        </View>
                        <View style={styles.detailsRow}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                            <AppText variant="caption" color={colors.textSecondary} style={styles.detailText}>
                                Starts: {batch.start_date}
                            </AppText>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.footer}>
                    <View style={styles.footerItem}>
                        <Ionicons name="book-outline" size={12} color={colors.primary} />
                        <AppText variant="caption" numberOfLines={1} style={styles.footerText}>
                            {batch.course_name}
                        </AppText>
                    </View>
                    <View style={styles.enrollmentBadge}>
                        <Ionicons name="people-outline" size={12} color={colors.slate} />
                        <AppText variant="caption" style={styles.enrollmentText}>
                            {batch.current_enrollment_count}/{batch.total_capacity}
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
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.primaryLight + '15',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primaryLight + '30',
    },
    avatarText: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 16,
    },
    mainInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontWeight: '700',
        fontSize: 15,
        flex: 1,
        marginRight: spacing.sm,
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
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 13,
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
        gap: spacing.md,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    footerText: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    enrollmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.slate + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    enrollmentText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.slate,
    },
});
