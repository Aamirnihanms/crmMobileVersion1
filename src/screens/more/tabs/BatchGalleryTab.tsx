import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';

import AppCard from '../../../components/common/AppCard';
import AppText from '../../../components/common/AppText';
import AppInput from '../../../components/common/AppInput';
import EmptyState from '../../../components/common/EmptyState';
import { MoreStackParamList } from '../../../navigation/MoreStack';
import { useInfiniteGalleries } from '../../../queries/gallery.query';
import { useAppTheme, spacing } from '../../../theme';

interface BatchGalleryTabProps {
    batchUid: string;
}

export default function BatchGalleryTab({ batchUid }: BatchGalleryTabProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
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
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteGalleries(debouncedSearch, batchUid);

    const galleries = data?.pages.flatMap((page) => page.galleries) || [];

    const renderItem = ({ item }: { item: any }) => (
        <Pressable
            onPress={() => navigation.navigate('GalleryDetail', { uid: item.uid })}
        >
            <AppCard style={styles.galleryCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="images-outline" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.headerInfo}>
                        <AppText variant="subtitle" style={{ fontWeight: '700' }}>{item.name}</AppText>
                        <AppText variant="caption" color={colors.textMuted}>
                            Created by {item.created_by_name}
                        </AppText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.is_active ? colors.success + '20' : colors.danger + '20' }]}>
                        <AppText variant="caption" style={{ color: item.is_active ? colors.success : colors.danger, fontWeight: '700' }}>
                            {item.is_active ? 'Active' : 'Inactive'}
                        </AppText>
                    </View>
                </View>

                <AppText variant="body" style={styles.description} numberOfLines={2}>
                    {item.description || 'No description provided.'}
                </AppText>

                <View style={styles.footer}>
                    <View style={styles.stat}>
                        <Ionicons name="videocam-outline" size={16} color={colors.textMuted} />
                        <AppText variant="caption" color={colors.textMuted} style={styles.statText}>
                            {item.videos_count} Videos
                        </AppText>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="folder-outline" size={16} color={colors.textMuted} />
                        <AppText variant="caption" color={colors.textMuted} style={styles.statText}>
                            {item.folders_count} Folders
                        </AppText>
                    </View>
                    {item.is_common && (
                        <View style={styles.commonBadge}>
                            <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>Common</AppText>
                        </View>
                    )}
                </View>
            </AppCard>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
                    <AppInput
                        placeholder="Search galleries..."
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchInput}
                        containerStyle={styles.searchContainer}
                    />
                </View>
            </View>

            {isLoading && !isFetchingNextPage ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={galleries}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
                    }
                    onEndReached={() => hasNextPage && fetchNextPage()}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() =>
                        isFetchingNextPage ? (
                            <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.primary} />
                        ) : null
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="images-outline"
                            title={search ? "No Results Found" : "No Galleries Found"}
                            description={search ? `We couldn't find any galleries matching "${search}"` : "This batch doesn't have any assigned galleries yet."}
                        />
                    }
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
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: colors.background,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight + '10',
        borderRadius: 16,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.primaryLight + '20',
        marginBottom: spacing.sm,
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
        padding: spacing.md,
        paddingBottom: 24,
    },
    galleryCard: {
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    headerInfo: {
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    description: {
        marginBottom: spacing.md,
        color: colors.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    statText: {
        marginLeft: 4,
    },
    commonBadge: {
        marginLeft: 'auto',
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
