import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';

import type { PaymentTransaction } from '@/src/api/payments.api';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import { useInfinitePaymentTransactions } from '@/src/queries/payments.query';
import { useAppTheme, spacing } from '@/src/theme';

import PaymentsFilterModal from '@/src/components/payments/PaymentsFilterModal';
import { usePaymentsFilters } from '@/src/hooks/usePaymentsFilters';
import { PaymentsStackParamList } from '@/src/navigation/PaymentsStack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

function PaymentItem({
    transaction,
    isLast = false,
    onPress
}: {
    transaction: PaymentTransaction;
    isLast?: boolean;
    onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const isCompleted = transaction.status === 'completed';
    const isFailed = transaction.status === 'failed';
    const isReversal = transaction.payment_method === 'reversal';

    // Status color logic
    let statusColor = colors.warning;
    if (isCompleted) statusColor = colors.success;
    if (isFailed || isReversal) statusColor = colors.danger;

    const formattedDate = new Date(transaction.payment_date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    return (
        <Pressable onPress={onPress}>
            <View style={styles.paymentItem}>
                <View style={[styles.paymentIcon, { backgroundColor: statusColor + '15' }]}>
                    <Ionicons
                        name={isReversal ? "refresh-circle-outline" : (isCompleted ? "checkmark-circle-outline" : isFailed ? "close-circle-outline" : "time-outline")}
                        size={20}
                        color={statusColor}
                    />
                </View>
                <View style={styles.paymentContent}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }} numberOfLines={1}>
                        {transaction.student_name || 'N/A'}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>{formattedDate}</AppText>
                    <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>{transaction.course_name}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <AppText variant="subtitle" style={{ fontWeight: '800', color: statusColor }}>
                        {parseFloat(transaction.amount) > 0 ? '₹' : ''}{parseFloat(transaction.amount).toLocaleString('en-IN')}
                    </AppText>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '10' }]}>
                        <AppText variant="caption" style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>
                            {transaction.status_display}
                        </AppText>
                    </View>
                </View>
            </View>
            {!isLast && <View style={styles.divider} />}
        </Pressable>
    );
}

export default function PaymentsListScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<NativeStackNavigationProp<PaymentsStackParamList>>();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const { filters, setAllFilters } = usePaymentsFilters();
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useInfinitePaymentTransactions(debouncedSearch, filters);

    const onRefresh = useCallback(async () => {
        try {
            setIsManualRefreshing(true);
            await refetch();
        } finally {
            setIsManualRefreshing(false);
        }
    }, [refetch]);

    const transactions = data?.pages.flatMap((page) => page.results) ?? [];
    const totalCount = data?.pages[0]?.access_control?.total_accessible_transactions ?? 0;

    const renderItem = useCallback(({ item, index }: { item: PaymentTransaction; index: number }) => (
        <PaymentItem
            transaction={item}
            isLast={index === transactions.length - 1}
            onPress={() => navigation.navigate('PaymentDetails', { uid: item.uid })}
        />
    ), [transactions.length, navigation]);

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.searchRow}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
                        <AppInput
                            placeholder="Search transactions..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            containerStyle={styles.searchContainer}
                        />
                    </View>
                    <Pressable
                        style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
                        onPress={() => setFilterVisible(true)}
                    >
                        <Ionicons
                            name="options-outline"
                            size={20}
                            color={activeFilterCount > 0 ? colors.primary : colors.textPrimary}
                        />
                        {activeFilterCount > 0 && (
                            <View style={styles.filterBadge}>
                                <AppText variant="caption" style={styles.filterBadgeText}>
                                    {activeFilterCount}
                                </AppText>
                            </View>
                        )}
                    </Pressable>
                </View>
            </View>

            {isError ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <AppText color={colors.danger} style={{ marginTop: spacing.md, textAlign: 'center', paddingHorizontal: spacing.xl, fontWeight: '600' }}>
                        {((error as any)?.response?.data?.detail) || ((error as any)?.response?.data?.error) || ((error as Error)?.message || 'Failed to load transactions')}
                    </AppText>
                    <Pressable onPress={() => refetch()} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12, backgroundColor: colors.primaryLight + '15' }}>
                        <AppText color={colors.primary}>Try Again</AppText>
                    </Pressable>
                </View>
            ) : (
                <FlashList
                    data={transactions}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderItem}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <AppCard style={styles.summaryCard}>
                                <LinearGradient
                                    colors={[colors.gradientStart, colors.gradientEnd]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.summaryGradient}
                                />
                                <View style={styles.summaryContent}>
                                    <View style={styles.summaryRow}>
                                        <View>
                                            <AppText variant="caption" color="rgba(255,255,255,0.7)" style={{ fontWeight: '600' }}>
                                                Total Transactions
                                            </AppText>
                                            <AppText variant="h1" color={colors.surface} style={{ fontWeight: '800', fontSize: 28 }}>
                                                {totalCount}
                                            </AppText>
                                        </View>
                                        <View style={styles.summaryIcon}>
                                            <Ionicons name="receipt" size={24} color={colors.surface} />
                                        </View>
                                    </View>
                                </View>
                            </AppCard>

                            <View style={styles.sectionHeader}>
                                <AppText variant="h3" style={styles.sectionTitle}>Transactions</AppText>
                            </View>
                        </View>
                    }
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <View style={{ paddingVertical: spacing.md }}>
                                <AppLoader />
                            </View>
                        ) : <View style={{ height: spacing.xl }} />
                    }
                    ListEmptyComponent={
                        isLoading && !isRefetching ? (
                            <View style={styles.center}>
                                <AppLoader />
                            </View>
                        ) : (
                            <View style={styles.center}>
                                <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                                <AppText color={colors.textMuted} style={{ marginTop: spacing.md }}>No transactions found</AppText>
                            </View>
                        )
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isManualRefreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}
            <PaymentsFilterModal
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                filters={filters}
                setAllFilters={setAllFilters}
            />
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.lg,
    },
    listHeader: {
        marginBottom: spacing.md,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: colors.background,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
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
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.primaryLight + '10',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primaryLight + '20',
        position: 'relative',
    },
    filterBtnActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight + '15',
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.primary,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
        paddingHorizontal: 4,
    },
    filterBadgeText: {
        color: colors.surface,
        fontSize: 10,
        fontWeight: '800',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xl * 2,
    },
    summaryCard: {
        padding: 0,
        borderRadius: 28,
        marginBottom: spacing.xl,
        overflow: 'hidden',
        shadowColor: colors.gradientEnd,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    summaryGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    summaryContent: {
        padding: spacing.xl,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    summaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryFooter: {
        flexDirection: 'row',
        gap: spacing.xl,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    summaryStat: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
    },
    transactionsCard: {
        padding: 0,
        borderRadius: 24,
        marginBottom: spacing.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.surfaceSubtle,
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
    },
    paymentIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    paymentContent: {
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: colors.surfaceSubtle,
        marginHorizontal: spacing.lg,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: 24,
        backgroundColor: colors.primaryLight + '10',
        borderWidth: 1,
        borderColor: colors.primaryLight + '20',
    },
    downloadBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
