import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { useInfiniteExamAttempts } from '@/src/queries/evaluation.query';
import { colors, spacing } from '@/src/theme';

export default function MarkingScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { sessionUid } = route.params;

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useInfiniteExamAttempts(sessionUid) as any;

    const attempts = data?.pages.flatMap((page: any) => page.data) ?? [];

    const renderItem = useCallback(({ item }: { item: any }) => (
        <AppCard style={styles.card}>
            <View style={styles.header}>
                <View style={styles.studentInfo}>
                    <View style={styles.avatar}>
                        <AppText variant="subtitle" color={colors.primary} style={{ fontWeight: '800' }}>
                            {item.student_name?.[0]?.toUpperCase()}
                        </AppText>
                    </View>
                    <View>
                        <AppText variant="subtitle" style={styles.studentName}>{item.student_name}</AppText>
                        <AppText variant="caption" color={colors.textMuted}>{item.student_id}</AppText>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <AppText variant="caption" color={getStatusColor(item.status)} style={{ fontWeight: '700' }}>
                        {item.status.toUpperCase()}
                    </AppText>
                </View>
            </View>

            <View style={styles.body}>
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <AppText variant="caption" color={colors.textMuted}>Attempt No</AppText>
                        <AppText variant="body" style={{ fontWeight: '600' }}>{item.attempt_no}</AppText>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoItem}>
                        <AppText variant="caption" color={colors.textMuted}>Score</AppText>
                        <AppText variant="body" style={{ fontWeight: '600' }}>{item.overall_percent !== null ? `${item.overall_percent}%` : 'N/A'}</AppText>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoItem}>
                        <AppText variant="caption" color={colors.textMuted}>Grade</AppText>
                        <AppText variant="body" style={{ fontWeight: '600' }}>{item.grade || 'N/A'}</AppText>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.evalInfo}>
                        <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                        <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
                            By: {item.evaluated_by_name || 'System'}
                        </AppText>
                    </View>
                    <Pressable
                        style={styles.markBtn}
                        onPress={() => navigation.navigate('EvaluationMarkingDetail', { attemptUid: item.uid })}
                    >
                        <AppText variant="caption" color="white" style={{ fontWeight: '700' }}>
                            {item.status === 'draft' ? 'START MARKING' : 'VIEW MARKS'}
                        </AppText>
                        <Ionicons name="chevron-forward" size={14} color="white" style={{ marginLeft: 4 }} />
                    </Pressable>
                </View>
            </View>
        </AppCard>
    ), [navigation]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return colors.success;
            case 'draft': return colors.warning;
            case 'published': return colors.info;
            default: return colors.textSecondary;
        }
    };

    if (isLoading && !isRefetching) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlashList
                data={attempts}
                keyExtractor={(item) => item.uid}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                onEndReachedThreshold={0.5}
                onEndReached={() => {
                    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                }}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} /> : null}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                        <AppText color={colors.textMuted} style={{ marginTop: 8 }}>No students found for this session</AppText>
                    </View>
                }
            />
        </View>
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
    listContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    card: {
        marginBottom: spacing.md,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    studentName: {
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    body: {
        gap: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutralSoft,
        borderRadius: 12,
        padding: spacing.sm,
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: colors.divider,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    evalInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    markBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    empty: {
        paddingTop: 100,
        alignItems: 'center',
    },
});
