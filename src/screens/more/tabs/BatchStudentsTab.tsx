import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

import { colors, spacing } from '@/src/theme';
import { useInfiniteStudents } from '@/src/queries/students.query';
import StudentCard from '@/src/components/cards/StudentCard';
import AppInput from '@/src/components/common/AppInput';
import AppText from '@/src/components/common/AppText';
import AppLoader from '@/src/components/common/AppLoader';

interface BatchStudentsTabProps {
    batchUid: string;
}

export default function BatchStudentsTab({ batchUid }: BatchStudentsTabProps) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const navigation = useNavigation<any>();
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
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useInfiniteStudents(debouncedSearch, { batch: batchUid }, isFocused);

    const students = data?.pages.flatMap((page) => page.students) || [];

    const renderItem = ({ item }: { item: any }) => (
        <StudentCard
            student={item}
            onPress={() => navigation.navigate('StudentDetails', { id: item.uid })}
        />
    );

    if (isLoading && !isFetchingNextPage) {
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
                <AppText color={colors.danger} style={styles.errorText}>Failed to load students.</AppText>
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
                      placeholder="Search by name or student ID..."
                      value={search}
                      onChangeText={setSearch}
                      style={styles.searchInput}
                      containerStyle={styles.searchContainer}
                    />
                  </View>
                </View>
            </View>

            {students.length === 0 && !isLoading ? (
                <View style={styles.center}>
                   <View style={styles.emptyIconCircle}>
                     <Ionicons name="school-outline" size={40} color={colors.primary} />
                   </View>
                   <AppText variant="h3" style={styles.emptyText}>
                     No Students Found
                   </AppText>
                   <AppText color={colors.textMuted} style={styles.emptySubtext}>
                     We could not find any students matching your search in this batch.
                   </AppText>
                </View>
            ) : (
                <FlashList
                    data={students}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    estimatedItemSize={120}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
                        ) : null
                    }
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
    listContent: {
        padding: spacing.lg,
        paddingTop: 0,
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
