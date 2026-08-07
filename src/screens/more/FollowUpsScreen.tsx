import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import { MoreStackParamList } from '@/src/navigation/MoreStack';
import { useInfiniteMyFollowUps } from '@/src/queries/followups.query';
import { useInfiniteMyReminders } from '@/src/queries/leads.query';
import { useAuthStore } from '@/src/store/auth.store';
import { useAppTheme, spacing } from '@/src/theme';

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

type TabType = 'followups' | 'reminders';
type SubTabType = 'today' | 'overdue' | 'upcoming';

export default function FollowUpsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const user = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState<TabType>('followups');
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('today');
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);

    const followUpFilters = useMemo(() => ({
        today_followups: activeSubTab === 'today' ? true : undefined,
        overdue_followups: activeSubTab === 'overdue' ? true : undefined,
        upcoming_followups: activeSubTab === 'upcoming' ? true : undefined,
    }), [activeSubTab]);

    const reminderFilters = useMemo(() => ({
        today_reminders: activeSubTab === 'today' ? true : undefined,
        overdue_reminders: activeSubTab === 'overdue' ? true : undefined,
        upcoming_reminders: activeSubTab === 'upcoming' ? true : undefined,
    }), [activeSubTab]);

    const {
        data: followUpsData,
        isLoading: isFollowUpsLoading,
        fetchNextPage: fetchNextFollowUps,
        hasNextPage: hasNextFollowUps,
        isFetchingNextPage: isFetchingNextFollowUps,
        refetch: refetchFollowUps,
        isRefetching: isRefetchingFollowUps,
    } = useInfiniteMyFollowUps(user?.uid || '', followUpFilters, activeTab === 'followups');

    const {
        data: remindersData,
        isLoading: isRemindersLoading,
        fetchNextPage: fetchNextReminders,
        hasNextPage: hasNextReminders,
        isFetchingNextPage: isFetchingNextReminders,
        refetch: refetchReminders,
        isRefetching: isRefetchingReminders,
    } = useInfiniteMyReminders(user?.uid || '', reminderFilters, activeTab === 'reminders');

    const currentData = activeTab === 'followups'
        ? followUpsData?.pages.flatMap(page => page.results) ?? []
        : remindersData?.pages.flatMap(page => page.results) ?? [];

    const isLoading = activeTab === 'followups' ? isFollowUpsLoading : isRemindersLoading;
    const isRefetching = activeTab === 'followups' ? isRefetchingFollowUps : isRefetchingReminders;
    const hasNextPage = activeTab === 'followups' ? hasNextFollowUps : hasNextReminders;
    const isFetchingNextPage = activeTab === 'followups' ? isFetchingNextFollowUps : isFetchingNextReminders;
    const fetchNextPage = activeTab === 'followups' ? fetchNextFollowUps : fetchNextReminders;
    const refetch = activeTab === 'followups' ? refetchFollowUps : refetchReminders;

    const onRefresh = useCallback(async () => {
        try {
            setIsManualRefreshing(true);
            await refetch();
        } finally {
            setIsManualRefreshing(false);
        }
    }, [refetch]);

    const counts = useMemo(() => {
        if (activeTab === 'followups') {
            return followUpsData?.pages[0]?.counts || { today: 0, overdue: 0, upcoming: 0, total: 0 };
        } else {
            return remindersData?.pages[0]?.counts || { today: 0, overdue: 0, upcoming: 0, total: 0 };
        }
    }, [activeTab, followUpsData, remindersData]);

    const totalFollowUps = followUpsData?.pages[0]?.counts?.total || 0;
    const totalReminders = remindersData?.pages[0]?.counts?.total || 0;

    const getSubTabBadgeColor = (tab: SubTabType, count: number) => {
        if (count === 0) return colors.surfaceSubtle;
        if (tab === 'overdue') return colors.danger;
        return colors.primary;
    };

    const renderFollowUpItem = useCallback(({ item }: { item: any }) => (
        <Pressable onPress={() => navigation.navigate('LeadDetails', { id: item.lead.id })}>
            <AppCard style={styles.itemCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.leadInfo}>
                        <AppText variant="subtitle" style={styles.leadName}>{item.lead.name}</AppText>
                        <View style={styles.statusBadge}>
                            <AppText variant="caption" style={styles.statusText}>{item.lead.lead_status_name}</AppText>
                        </View>
                    </View>
                    <AppText variant="caption" color={colors.textMuted}>
                        {formatDate(item.next_follow_up_date)}
                    </AppText>
                </View>
                <View style={styles.divider} />
                <View style={styles.cardContent}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                    <AppText variant="body" style={styles.notes} numberOfLines={2}>{item.notes || 'No notes provided'}</AppText>
                </View>
                <View style={styles.cardFooter}>
                    <View style={styles.footerIconText}>
                        <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                        <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>{item.lead.phone_number}</AppText>
                    </View>
                    <View style={[styles.importanceBadge, { backgroundColor: getImportanceColor(item.importance) + '20' }]}>
                        <AppText variant="caption" style={{ color: getImportanceColor(item.importance), fontWeight: '700' }}>{item.importance}</AppText>
                    </View>
                </View>
            </AppCard>
        </Pressable>
    ), [navigation]);

    const renderReminderItem = useCallback(({ item }: { item: any }) => (
        <Pressable onPress={() => navigation.navigate('LeadDetails', { id: item.id })}>
            <AppCard style={styles.itemCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.leadInfo}>
                        <AppText variant="subtitle" style={styles.leadName}>{item.name}</AppText>
                        <View style={styles.statusBadge}>
                            <AppText variant="caption" style={styles.statusText}>{item.lead_status_name}</AppText>
                        </View>
                    </View>
                    <AppText variant="caption" color={colors.textMuted}>
                        {formatDate(item.reminder_date)}
                    </AppText>
                </View>
                <View style={styles.divider} />
                <View style={styles.cardFooter}>
                    <View style={styles.footerIconText}>
                        <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                        <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>{item.phone_number}</AppText>
                    </View>
                    <View style={styles.footerIconText}>
                        <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
                        <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }} numberOfLines={1}>{item.email || 'No email'}</AppText>
                    </View>
                </View>
            </AppCard>
        </Pressable>
    ), [navigation]);

    const getImportanceColor = (importance: string) => {
        switch (importance) {
            case 'HIGH': return colors.danger;
            case 'URGENT': return colors.danger;
            case 'IMPORTANT': return colors.warning;
            case 'NORMAL': return colors.info;
            case 'LOW': return colors.textMuted;
            default: return colors.primary;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <Pressable
                    style={[styles.tab, activeTab === 'followups' && styles.activeTab]}
                    onPress={() => setActiveTab('followups')}
                >
                    <Ionicons name="repeat-outline" size={18} color={activeTab === 'followups' ? colors.primary : colors.textMuted} />
                    <AppText style={[styles.tabText, activeTab === 'followups' && styles.activeTabText]}>Followups</AppText>
                    {totalFollowUps > 0 && (
                        <View style={styles.mainTabBadge}>
                            <AppText style={styles.mainTabBadgeText}>{totalFollowUps}</AppText>
                        </View>
                    )}
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'reminders' && styles.activeTab]}
                    onPress={() => setActiveTab('reminders')}
                >
                    <Ionicons name="notifications-outline" size={18} color={activeTab === 'reminders' ? colors.primary : colors.textMuted} />
                    <AppText style={[styles.tabText, activeTab === 'reminders' && styles.activeTabText]}>Reminders</AppText>
                    {totalReminders > 0 && (
                        <View style={styles.mainTabBadge}>
                            <AppText style={styles.mainTabBadgeText}>{totalReminders}</AppText>
                        </View>
                    )}
                </Pressable>
            </View>

            <View style={styles.subTabBar}>
                {(['today', 'overdue', 'upcoming'] as SubTabType[]).map((tab) => (
                    <Pressable
                        key={tab}
                        style={[styles.subTab, activeSubTab === tab && styles.activeSubTab]}
                        onPress={() => setActiveSubTab(tab)}
                    >
                        <View style={styles.subTabContent}>
                            <AppText style={[styles.subTabText, activeSubTab === tab && styles.activeSubTabText]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </AppText>
                            <View style={[
                                styles.countBadge,
                                { backgroundColor: getSubTabBadgeColor(tab, counts[tab as keyof typeof counts] || 0) }
                            ]}>
                                <AppText style={[
                                    styles.countBadgeText,
                                    (counts[tab as keyof typeof counts] || 0) > 0 && styles.activeCountBadgeText
                                ]}>
                                    {counts[tab as keyof typeof counts] || 0}
                                </AppText>
                            </View>
                        </View>
                        {activeSubTab === tab && <View style={styles.subTabIndicator} />}
                    </Pressable>
                ))}
            </View>

            {isLoading ? (
                <AppLoader />
            ) : (
                <FlashList
                    data={currentData}
                    renderItem={activeTab === 'followups' ? renderFollowUpItem : renderReminderItem}
                    contentContainerStyle={styles.listContent}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={isManualRefreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={64} color={colors.surfaceSubtle} />
                            <AppText variant="h3" style={styles.emptyText}>No {activeTab} for {activeSubTab}</AppText>
                            <AppText variant="body" color={colors.textMuted}>{"You're all caught up!"}</AppText>
                        </View>
                    }
                    ListFooterComponent={isFetchingNextPage ? <AppLoader /> : <View style={{ height: 20 }} />}
                />
            )}
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: colors.background,
        gap: spacing.md,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: 16,
        backgroundColor: colors.surfaceSubtle,
        gap: 8,
    },
    activeTab: {
        backgroundColor: colors.primary + '10',
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    tabText: {
        fontWeight: '700',
        color: colors.textMuted,
    },
    activeTabText: {
        color: colors.primary,
    },
    subTabBar: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
    },
    subTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    activeSubTab: {
    },
    subTabText: {
        fontWeight: '600',
        color: colors.textMuted,
        fontSize: 15,
    },
    activeSubTabText: {
        color: colors.textPrimary,
        fontWeight: '800',
    },
    subTabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    countBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeCountBadge: {
        backgroundColor: colors.primary,
    },
    inactiveCountBadge: {
        backgroundColor: colors.surfaceSubtle,
    },
    countBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
    },
    activeCountBadgeText: {
        color: colors.surface,
    },
    mainTabBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: colors.background,
    },
    mainTabBadgeText: {
        color: colors.surface,
        fontSize: 10,
        fontWeight: '800',
    },
    subTabIndicator: {
        position: 'absolute',
        bottom: 0,
        width: 30,
        height: 3,
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
    listContent: {
        padding: spacing.lg,
    },
    itemCard: {
        marginBottom: spacing.md,
        padding: spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    leadInfo: {
        flex: 1,
        marginRight: spacing.sm,
    },
    leadName: {
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: colors.primary + '10',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: colors.surfaceSubtle,
        marginVertical: spacing.md,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: spacing.md,
    },
    notes: {
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerIconText: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    importanceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: spacing.lg,
        marginBottom: 4,
        fontWeight: '700',
    },
});
