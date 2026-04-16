import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';
import BatchChangeRequestCard from '../../components/cards/BatchChangeRequestCard';
import { colors, spacing } from '@/src/theme';
import { useBatchChangeRequests } from '../../queries/batch-change.query';
import { MoreStackParamList } from '../../navigation/MoreStack';
import type { BatchChangeRequest } from '../../api/batch-change.api';

export default function BatchChangeRequestListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useBatchChangeRequests({ 
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter
    }) as any;

    const requests = data?.pages.flatMap((page: any) => page.data.requests) ?? [];
    const summary = data?.pages[0]?.data.summary;

    const renderItem = useCallback(({ item }: { item: BatchChangeRequest }) => (
        <BatchChangeRequestCard 
            request={item} 
            onPress={() => {
                navigation.navigate('BatchChangeRequestDetail', { uid: item.uid });
            }}
        />
    ), []);

    const renderHeader = () => {
        if (!summary) return null;
        return (
            <View style={styles.summaryContainer}>
                <View style={[styles.summaryItem, { borderColor: colors.primary + '30' }]}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="layers-outline" size={14} color={colors.primary} />
                    </View>
                    <View style={styles.summaryTextWrapper}>
                        <AppText variant="caption" color={colors.textMuted} style={styles.summaryLabel}>TOTAL</AppText>
                        <AppText variant="subtitle" style={styles.summaryValue}>{summary.total_requests}</AppText>
                    </View>
                </View>
                <View style={[styles.summaryItem, { borderColor: colors.warning + '30' }]}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.warning + '15' }]}>
                        <Ionicons name="time-outline" size={14} color={colors.warning} />
                    </View>
                    <View style={styles.summaryTextWrapper}>
                        <AppText variant="caption" color={colors.textMuted} style={styles.summaryLabel}>PENDING</AppText>
                        <AppText variant="subtitle" style={styles.summaryValue}>{summary.pending_count}</AppText>
                    </View>
                </View>
                <View style={[styles.summaryItem, { borderColor: colors.success + '30' }]}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.success + '15' }]}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                    </View>
                    <View style={styles.summaryTextWrapper}>
                        <AppText variant="caption" color={colors.textMuted} style={styles.summaryLabel}>APPROVED</AppText>
                        <AppText variant="subtitle" style={styles.summaryValue}>{summary.approved_count}</AppText>
                    </View>
                </View>
            </View>
        );
    };

    const statusOptions = [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Processed', value: 'processed' },
        { label: 'Rejected', value: 'rejected' }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchRow}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
                        <AppInput
                            placeholder="Search student..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            containerStyle={styles.searchContainer}
                        />
                    </View>
                </View>

                <View style={styles.filterRow}>
                    {statusOptions.map((opt) => (
                        <Pressable 
                            key={opt.value}
                            onPress={() => setStatusFilter(opt.value)}
                            style={[
                                styles.statusTab,
                                statusFilter === opt.value && styles.statusTabActive
                            ]}
                        >
                            <AppText 
                                variant="caption" 
                                color={statusFilter === opt.value ? colors.primary : colors.textMuted}
                                style={{ fontWeight: statusFilter === opt.value ? '700' : '500' }}
                            >
                                {opt.label}
                            </AppText>
                        </Pressable>
                    ))}
                </View>

                {renderHeader()}
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <AppLoader />
                </View>
            ) : isError ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <AppText color={colors.danger} style={styles.errorText}>Failed to load requests</AppText>
                    <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                        <AppText color={colors.primary}>Try Again</AppText>
                    </Pressable>
                </View>
            ) : requests.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="git-pull-request-outline" size={40} color={colors.primary} />
                    </View>
                    <AppText variant="h3" style={styles.emptyText}>No Requests Found</AppText>
                    <AppText color={colors.textMuted} style={styles.emptySubtext}>
                        We couldn't find any batch change requests.
                    </AppText>
                </View>
            ) : (
                <FlashList
                    data={requests}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={isFetchingNextPage ? <AppLoader /> : <View style={{ height: spacing.xl }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    estimatedItemSize={160}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: colors.background,
        gap: spacing.md,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight + '10',
        borderRadius: 16,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.primaryLight + '20',
    },
    searchIcon: {
        marginRight: spacing.xs,
    },
    searchContainer: {
        flex: 1,
        marginBottom: 0,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    searchInput: {
        height: 48,
        fontSize: 15,
    },
    filterRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    statusTab: {
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statusTabActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight + '10',
    },
    summaryContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    summaryItem: {
        flex: 1,
        padding: spacing.sm,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
    },
    summaryIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryTextWrapper: {
        flex: 1,
    },
    summaryLabel: {
        fontWeight: '700',
        fontSize: 8,
        letterSpacing: 0.3,
        marginBottom: 0,
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontWeight: '800',
        fontSize: 14,
        color: colors.textPrimary,
        marginTop: -2,
    },
    list: {
        padding: spacing.lg,
        paddingTop: spacing.md,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyText: {
        fontWeight: '700',
        marginBottom: 4,
    },
    emptySubtext: {
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
    },
    errorText: {
        marginTop: spacing.md,
        fontWeight: '600',
    },
    retryBtn: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.primaryLight + '15',
    },
});
