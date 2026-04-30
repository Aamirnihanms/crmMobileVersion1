import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';
import DroppedStudentCard from '../../components/cards/DroppedStudentCard';
import { colors, spacing } from '@/src/theme';
import { useInfiniteDroppedStudents } from '../../queries/students.query';
import { MoreStackParamList } from '../../navigation/MoreStack';
import type { DroppedStudent } from '../../api/students.api';

export default function DroppedStudentsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

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
    } = useInfiniteDroppedStudents(debouncedSearch);

    const students = data?.pages.flatMap((page) => page.students) ?? [];
    const totalCount = data?.pages[0]?.pagination.total_count ?? 0;

    const renderItem = useCallback(({ item }: { item: DroppedStudent }) => (
        <DroppedStudentCard 
            student={item} 
            onPress={() => {
                navigation.navigate('StudentDetails', { id: item.student_id });
            }}
        />
    ), [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchRow}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
                        <AppInput
                            placeholder="Search dropped students..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            containerStyle={styles.searchContainer}
                        />
                    </View>
                </View>

                <View style={styles.summaryContainer}>
                    <View style={styles.summaryItem}>
                        <Ionicons name="people-outline" size={16} color={colors.primary} />
                        <AppText variant="caption" style={styles.summaryText}>
                            Total Dropped: <AppText variant="caption" style={{ fontWeight: '700' }}>{totalCount}</AppText>
                        </AppText>
                    </View>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <AppLoader />
                </View>
            ) : isError ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <AppText color={colors.danger} style={styles.errorText}>Failed to load students</AppText>
                    <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                        <AppText color={colors.primary}>Try Again</AppText>
                    </Pressable>
                </View>
            ) : students.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="person-remove-outline" size={40} color={colors.primary} />
                    </View>
                    <AppText variant="h3" style={styles.emptyText}>No Students Found</AppText>
                    <AppText color={colors.textMuted} style={styles.emptySubtext}>
                        We couldn't find any dropped students.
                    </AppText>
                </View>
            ) : (
                <FlashList
                    data={students}
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
        gap: spacing.sm,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
    summaryContainer: {
        flexDirection: 'row',
        paddingVertical: spacing.xs,
        paddingLeft: 4,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryText: {
        color: colors.textSecondary,
    },
    list: {
        padding: spacing.lg,
        paddingTop: spacing.sm,
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
