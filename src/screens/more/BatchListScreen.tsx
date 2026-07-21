import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InfiniteData } from '@tanstack/react-query';

import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';
import BatchCard from '../../components/cards/BatchCard';
import { useAppTheme, spacing } from '@/src/theme';
import { useInfiniteBatches } from '../../queries/batches.query';
import type { BatchesPageResponse } from '../../api/batches.api';

/* 🔥 ENTERPRISE FILTERS */
import BatchesFilterModal from '../../components/batches/BatchesFilterModal';
import { useBatchesFilters } from '../../hooks/useBatchesFilters';
import { MoreStackParamList } from '../../navigation/MoreStack';

export default function BatchListScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    /* ---------------- FILTERS ---------------- */
    const { filters, setAllFilters } = useBatchesFilters();
    const [openFilter, setOpenFilter] = useState(false);
    const activeFilterCount = Object.keys(filters).filter(k => k !== 'inactive' && filters[k as keyof typeof filters]).length;

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable 
                    onPress={() => navigation.navigate('BatchCreate')}
                    style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                        marginRight: 4,
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primaryLight + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                    })}
                >
                    <Ionicons name="add" size={24} color={colors.primary} />
                </Pressable>
            ),
        });
    }, [navigation]);

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
    } = useInfiniteBatches(debouncedSearch, filters) as any;

    const batches = data?.pages.flatMap((page: BatchesPageResponse) => page.batches) ?? [];
    const summary = data?.pages[0]?.summary;

    const renderItem = useCallback(({ item }: { item: any }) => (
        <BatchCard 
            batch={item} 
            onPress={() => navigation.navigate('BatchDetail', { uid: item.uid })}
        />
    ), [navigation]);

    const renderHeader = () => {
        if (!summary) return null;
        return (
            <View style={styles.summaryContainer}>
                <View style={[styles.summaryItem, { backgroundColor: colors.primary + '10' }]}>
                    <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>TOTAL</AppText>
                    <AppText variant="h3" style={{ fontWeight: '800' }}>{summary.total_batches}</AppText>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: colors.success + '10' }]}>
                    <AppText variant="caption" color={colors.success} style={{ fontWeight: '700' }}>ENROLLED</AppText>
                    <AppText variant="h3" style={{ fontWeight: '800' }}>{summary.total_enrolled}</AppText>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: colors.info + '10' }]}>
                    <AppText variant="caption" color={colors.info} style={{ fontWeight: '700' }}>OPEN</AppText>
                    <AppText variant="h3" style={{ fontWeight: '800' }}>{summary.open_batches}</AppText>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchRow}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
                        <AppInput
                            placeholder="Search batches..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            containerStyle={styles.searchContainer}
                        />
                    </View>
                    <Pressable 
                        style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]} 
                        onPress={() => setOpenFilter(true)}
                    >
                        <Ionicons 
                            name={activeFilterCount > 0 ? "options" : "options-outline"} 
                            size={22} 
                            color={activeFilterCount > 0 ? colors.primary : colors.textPrimary} 
                        />
                        {activeFilterCount > 0 && (
                            <View style={styles.filterBadge}>
                                <AppText color={colors.surface} style={styles.filterBadgeText}>{activeFilterCount}</AppText>
                            </View>
                        )}
                    </Pressable>
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
                    <AppText color={colors.danger} style={styles.errorText}>Failed to load batches</AppText>
                    <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                        <AppText color={colors.primary}>Try Again</AppText>
                    </Pressable>
                </View>
            ) : batches.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="layers-outline" size={40} color={colors.primary} />
                    </View>
                    <AppText variant="h3" style={styles.emptyText}>No Batches Found</AppText>
                    <AppText color={colors.textMuted} style={styles.emptySubtext}>
                        We couldn't find any batches matching your criteria.
                    </AppText>
                </View>
            ) : (
                <FlashList
                    data={batches}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={isFetchingNextPage ? <AppLoader /> : <View style={{ height: spacing.xl }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                />
            )}

            <BatchesFilterModal
                visible={openFilter}
                onClose={() => setOpenFilter(false)}
                filters={filters}
                setAllFilters={setAllFilters}
            />
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
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
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.primaryLight + '10',
        borderWidth: 1,
        borderColor: colors.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterButtonActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight + '20',
    },
    filterBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: colors.primary,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    summaryContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    summaryItem: {
        flex: 1,
        padding: spacing.md,
        borderRadius: 16,
        alignItems: 'center',
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
