import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { useState, useEffect } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import type { LeadsPageResponse } from '../../api/leads.api';


import AppText from '../../components/common/AppText';
import AppLoader from '../../components/common/AppLoader';
import AppInput from '../../components/common/AppInput';
import LeadCard from '../../components/cards/LeadCard';
import { spacing } from '../../theme';
import { useInfiniteLeads } from '../../queries/leads.query';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LeadsStackParamList } from '../../navigation/LeadsStack';


export default function LeadsListScreen() {
    /* ---------------- SEARCH STATE ---------------- */
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // 🔹 Debounce search (VERY IMPORTANT)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    /* ---------------- NAVIGATION ---------------- */
    const navigation =
        useNavigation<NativeStackNavigationProp<LeadsStackParamList>>();


    /* ---------------- QUERY ---------------- */
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
    } = useInfiniteLeads(debouncedSearch) as {
        data: InfiniteData<LeadsPageResponse> | undefined;
        isLoading: boolean;
        isError: boolean;
        error: unknown;
        fetchNextPage: () => void;
        hasNextPage?: boolean;
        isFetchingNextPage: boolean;
        refetch: () => void;
        isRefetching: boolean;
    };

    /* ---------------- STATES ---------------- */

    // 1️⃣ Initial loading
    if (isLoading) {
        return <AppLoader />;
    }

    // 2️⃣ Error state
    if (isError) {
        return (
            <View style={styles.center}>
                <AppText color="red">
                    {(error as Error)?.message || 'Failed to load leads'}
                </AppText>
            </View>
        );
    }

    // 3️⃣ Flatten paginated data
    const leads =
        data?.pages.flatMap((page) => page.results) ?? [];

    /* ---------------- UI ---------------- */

    return (
        <View style={styles.container}>
            {/* 🔍 SEARCH BAR */}
            <View style={styles.searchContainer}>
                <AppInput
                    placeholder="Search leads by name, phone, email..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* 📋 EMPTY STATE */}
            {!leads.length ? (
                <View style={styles.center}>
                    <AppText>No leads found</AppText>
                </View>
            ) : (
                <FlatList
                    data={leads}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <LeadCard
                            lead={item}
                            onPress={() =>
                                navigation.navigate('LeadDetails', { id: item.id })
                            }
                        />
                    )}
                    contentContainerStyle={styles.list}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        isFetchingNextPage ? <AppLoader /> : null
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                        />
                    }
                />
            )}
        </View>
    );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    list: {
        padding: spacing.md,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
});
