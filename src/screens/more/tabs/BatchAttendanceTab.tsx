import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

import { useAppTheme, spacing } from '@/src/theme';
import { useAttendanceList } from '@/src/queries/attendance.query';
import AttendanceStudentCard from '@/src/components/cards/AttendanceStudentCard';
import AttendanceFilterModal from '@/src/components/attendance/AttendanceFilterModal';
import AppInput from '@/src/components/common/AppInput';
import AppText from '@/src/components/common/AppText';
import AppLoader from '@/src/components/common/AppLoader';
import { AttendanceFilters } from '@/src/api/attendance.api';

interface BatchAttendanceTabProps {
    batchUid: string;
}

export default function BatchAttendanceTab({ batchUid }: BatchAttendanceTabProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [filters, setFilters] = useState<AttendanceFilters>({
        batch_id: batchUid,
    });

    const isFocused = useIsFocused();

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
        refetch,
        isRefetching,
    } = useAttendanceList({
        ...filters,
        search: debouncedSearch,
    }, isFocused);

    const hasActiveFilters = !!(filters.attendance_status || filters.start_date || filters.end_date);

    const attendanceData = data?.data || [];
    const stats = data?.data.reduce((acc, curr) => {
        acc.total += curr.attendance_summary.total_classes;
        acc.percentage += curr.attendance_summary.attendance_percentage;
        return acc;
    }, { total: 0, percentage: 0 }) || { total: 0, percentage: 0 };

    const avgPercentage = attendanceData.length > 0 ? stats.percentage / attendanceData.length : 0;

    const renderHeader = () => {
        if (attendanceData.length === 0) return null;
        
        return (
            <View style={styles.statsCard}>
                <View style={styles.statsIconBox}>
                    <Ionicons name="analytics" size={24} color={colors.primary} />
                </View>
                <View style={styles.statsInfo}>
                    <AppText style={styles.statsLabel}>Average Batch Attendance</AppText>
                    <AppText variant="h2" style={[styles.statsValue, { color: avgPercentage >= 75 ? colors.success : colors.warning }]}>
                        {avgPercentage.toFixed(1)}%
                    </AppText>
                </View>
                <View style={styles.statsBadge}>
                    <AppText style={styles.statsBadgeText}>{attendanceData.length} Students</AppText>
                </View>
            </View>
        );
    };

    if (isLoading && !isRefetching) {
        return (
            <View style={styles.center}>
                <AppLoader />
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                <AppText color={colors.danger} style={styles.errorText}>Failed to load attendance.</AppText>
                <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                    <AppText color={colors.primary}>Try Again</AppText>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchRow}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
                        <AppInput
                            placeholder="Search student by name..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            containerStyle={styles.searchContainer}
                        />
                    </View>
                    <Pressable 
                        onPress={() => setIsFilterModalVisible(true)}
                        style={[
                            styles.filterBtn,
                            hasActiveFilters && styles.filterBtnActive
                        ]}
                    >
                        <Ionicons 
                            name={hasActiveFilters ? "filter" : "filter-outline"} 
                            size={22} 
                            color={hasActiveFilters ? colors.surface : colors.primary} 
                        />
                        {hasActiveFilters && <View style={styles.filterDot} />}
                    </Pressable>
                </View>
            </View>

            <FlashList
                data={attendanceData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <AttendanceStudentCard student={item} batchId={batchUid} />}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="calendar-outline" size={40} color={colors.primary} />
                            </View>
                            <AppText variant="h3" style={styles.emptyText}>No Attendance Found</AppText>
                            <AppText color={colors.textMuted} style={styles.emptySubtext}>
                                {"We couldn't find any attendance logs for this batch or search."}
                            </AppText>
                        </View>
                    ) : null
                }
            />

            <AttendanceFilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                filters={filters}
                onApply={(newFilters) => setFilters(newFilters)}
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
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
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
        borderColor: colors.border,
    },
    filterBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.danger,
        borderWidth: 1.5,
        borderColor: colors.surface,
    },
    statsCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: spacing.md,
        marginBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: colors.primaryLight + '30',
        marginHorizontal: spacing.sm,
    },
    statsIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    statsInfo: {
        flex: 1,
    },
    statsLabel: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '600',
    },
    statsValue: {
        fontWeight: '800',
        marginTop: -2,
    },
    statsBadge: {
        backgroundColor: colors.primaryLight + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statsBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
    },
    listContent: {
        padding: spacing.lg,
        paddingTop: spacing.sm,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.background,
    },
    errorText: {
        marginTop: spacing.md,
        textAlign: 'center',
        fontWeight: '600',
    },
    retryBtn: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.primaryLight + '15',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
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
});
