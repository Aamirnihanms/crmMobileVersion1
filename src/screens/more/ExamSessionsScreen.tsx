import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    Share,
    StyleSheet,
    View,
} from 'react-native';

import BatchesFilterModal from '@/src/components/batches/BatchesFilterModal';
import BatchCard from '@/src/components/cards/BatchCard';
import AppInput from '@/src/components/common/AppInput';
import AppText from '@/src/components/common/AppText';
import CreateExamSessionSheet from '@/src/components/evaluation/CreateExamSessionSheet';
import { useBatchesFilters } from '@/src/hooks/useBatchesFilters';
import { useInfiniteBatches } from '@/src/queries/batches.query';
import { useInfiniteExamSessions } from '@/src/queries/evaluation.query';
import { useAppTheme, spacing } from '@/src/theme';

export default function ExamSessionsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const selectedBatch = route.params?.batch;

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedSessionForEdit, setSelectedSessionForEdit] = useState<any>(null);

    /* ---------------- BATCH FILTERS ---------------- */
    const { filters, setAllFilters } = useBatchesFilters();
    const [openFilter, setOpenFilter] = useState(false);
    const activeFilterCount = Object.keys(filters).filter(k => k !== 'inactive' && filters[k as keyof typeof filters]).length;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    /* ---------------- QUERIES ---------------- */
    // Only run batches query if no batch is selected
    const {
        data: batchData,
        isLoading: isLoadingBatches,
        fetchNextPage: fetchNextBatches,
        hasNextPage: hasMoreBatches,
        isFetchingNextPage: isFetchingNextBatches,
        refetch: refetchBatches,
        isRefetching: isRefetchingBatches,
    } = useInfiniteBatches(debouncedSearch, filters, { enabled: !selectedBatch }) as any;

    // Only run sessions query if a batch is selected
    const {
        data: sessionData,
        isLoading: isLoadingSessions,
        fetchNextPage: fetchNextSessions,
        hasNextPage: hasMoreSessions,
        isFetchingNextPage: isFetchingNextSessions,
        refetch: refetchSessions,
        isRefetching: isRefetchingSessions,
    } = useInfiniteExamSessions(selectedBatch?.uid) as any;

    const batches = batchData?.pages.flatMap((page: any) => page.batches) ?? [];
    const sessions = sessionData?.pages.flatMap((page: any) => page.data) ?? [];

    /* ---------------- EFFECTS ---------------- */
    useEffect(() => {
        if (selectedBatch) {
            navigation.setOptions({ title: `Sessions: ${selectedBatch.batch_name}` });
        } else {
            navigation.setOptions({ title: 'Select Batch' });
        }
    }, [selectedBatch, navigation]);

    /* ---------------- HANDLERS ---------------- */
    const handleSelectBatch = (batch: any) => {
        // Push a new instance of the same screen with the batch param
        // This ensures the hardware back button works as expected
        navigation.push('ExamSessions', { batch });
    };

    const renderBatchItem = useCallback(({ item }: { item: any }) => (
        <BatchCard
            batch={item}
            onPress={() => handleSelectBatch(item)}
        />
    ), []);

    const handleCopyLink = async (link: string) => {
        await Clipboard.setStringAsync(link);
        Alert.alert('Copied', 'Exam link copied to clipboard');
    };

    const handleShareLink = async (link: string, name: string) => {
        try {
            await Share.share({
                message: `Join the exam session "${name}" here: ${link}`,
            });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const renderSessionItem = useCallback(({ item }: { item: any }) => (
        <View style={styles.sessionCard}>
            <Pressable onPress={() => navigation.navigate('Marking', { sessionUid: item.uid })}>
            <View style={styles.sessionHeader}>
                <View style={styles.sessionTitleRow}>
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <AppText variant="subtitle" style={styles.examName}>{item.exam_name}</AppText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <AppText variant="caption" color={getStatusColor(item.status)} style={{ fontWeight: '700' }}>
                        {item.status.toUpperCase()}
                    </AppText>
                </View>
            </View>

            <View style={styles.sessionBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                    <AppText variant="body" color={colors.textSecondary} style={styles.infoText}>
                        {new Date(item.scheduled_date).toLocaleString()}
                    </AppText>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="layers-outline" size={16} color={colors.textMuted} />
                    <AppText variant="body" color={colors.textSecondary} style={styles.infoText}>
                        {item.exam_type_code}
                    </AppText>
                </View>
                {!!item.exam_link && (
                    <View style={styles.infoRow}>
                        <Ionicons name="link-outline" size={16} color={colors.primary} />
                        <AppText variant="body" color={colors.primary} style={[styles.infoText, { flex: 1 }]} numberOfLines={1}>
                            {item.exam_link}
                        </AppText>
                    </View>
                )}
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.chevron} />
            </Pressable>

            {/* Action Bar */}
            <View style={styles.actionBar}>
                <Pressable style={styles.actionBtn} onPress={() => { setSelectedSessionForEdit(item); setShowCreate(true); }}>
                    <Ionicons name="pencil" size={16} color={colors.textMuted} />
                    <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 4 }}>Edit</AppText>
                </Pressable>
                
                {!!item.exam_link && (
                    <>
                        <View style={styles.actionDivider} />
                        <Pressable style={styles.actionBtn} onPress={() => handleCopyLink(item.exam_link)}>
                            <Ionicons name="copy-outline" size={16} color={colors.textMuted} />
                            <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 4 }}>Copy</AppText>
                        </Pressable>
                        <View style={styles.actionDivider} />
                        <Pressable style={styles.actionBtn} onPress={() => handleShareLink(item.exam_link, item.exam_name)}>
                            <Ionicons name="share-social-outline" size={16} color={colors.primary} />
                            <AppText variant="caption" color={colors.primary} style={{ marginLeft: 4 }}>Share</AppText>
                        </Pressable>
                    </>
                )}
            </View>
        </View>
    ), [navigation, colors, styles]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return colors.success;
            case 'draft': return colors.warning;
            case 'published': return colors.info;
            default: return colors.textSecondary;
        }
    };

    if (!selectedBatch) {
        return (
            <View style={styles.container}>
                <View style={styles.searchBar}>
                    <View style={{ flex: 1 }}>
                        <AppInput
                            placeholder="Search batches..."
                            value={search}
                            onChangeText={setSearch}
                            leftElement={<Ionicons name="search" size={20} color={colors.textMuted} />}
                        />
                    </View>
                    <Pressable
                        onPress={() => setOpenFilter(true)}
                        style={styles.filterBtn}
                    >
                        <Ionicons name="filter" size={24} color={activeFilterCount > 0 ? colors.primary : colors.textPrimary} />
                        {activeFilterCount > 0 && (
                            <View style={styles.badge}>
                                <AppText color="white" style={{ fontSize: 10, fontWeight: '700' }}>{activeFilterCount}</AppText>
                            </View>
                        )}
                    </Pressable>
                </View>

                <FlashList
                    data={batches}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderBatchItem}
                    contentContainerStyle={styles.listContent}
                    onEndReachedThreshold={0.5}
                    onEndReached={() => {
                        if (hasMoreBatches && !isFetchingNextBatches) fetchNextBatches();
                    }}
                    ListFooterComponent={isFetchingNextBatches ? <ActivityIndicator style={{ margin: 20 }} /> : null}
                    refreshControl={
                        <RefreshControl refreshing={isRefetchingBatches} onRefresh={refetchBatches} />
                    }
                    ListEmptyComponent={
                        isLoadingBatches ? (
                            <View style={styles.empty}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <AppText color={colors.textMuted} style={{ marginTop: 16 }}>Loading batches...</AppText>
                            </View>
                        ) : (
                            <View style={styles.empty}>
                                <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                                <AppText color={colors.textMuted} style={{ marginTop: 8 }}>No batches found</AppText>
                            </View>
                        )
                    }
                />

                <BatchesFilterModal
                    visible={openFilter}
                    onClose={() => setOpenFilter(false)}
                    filters={filters}
                    setAllFilters={setAllFilters}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlashList
                data={sessions}
                keyExtractor={(item) => item.uid}
                renderItem={renderSessionItem}
                contentContainerStyle={styles.listContent}
                onEndReachedThreshold={0.5}
                onEndReached={() => {
                    if (hasMoreSessions && !isFetchingNextSessions) fetchNextSessions();
                }}
                ListFooterComponent={isFetchingNextSessions ? <ActivityIndicator style={{ margin: 20 }} /> : null}
                refreshControl={
                    <RefreshControl refreshing={isRefetchingSessions} onRefresh={refetchSessions} />
                }
                ListEmptyComponent={
                    !isLoadingSessions ? (
                        <View style={styles.empty}>
                            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                            <AppText color={colors.textMuted} style={{ marginTop: 8 }}>No exam sessions scheduled</AppText>
                        </View>
                    ) : null
                }
            />

            {/* FAB */}
            <Pressable
                style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => setShowCreate(true)}
            >
                <Ionicons name="add" size={28} color={colors.surface} />
            </Pressable>

            <CreateExamSessionSheet
                visible={showCreate}
                onClose={() => { setShowCreate(false); setSelectedSessionForEdit(null); }}
                batch={selectedBatch}
                initialData={selectedSessionForEdit}
            />
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        gap: spacing.sm,
    },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.divider,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.primary,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    empty: {
        paddingTop: 100,
        alignItems: 'center',
    },
    batchInfoBar: {
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    batchTitleContainer: {
        flex: 1,
    },
    sessionCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
        position: 'relative',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sessionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    examName: {
        fontWeight: '700',
        marginLeft: spacing.sm,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    sessionBody: {
        gap: spacing.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginLeft: spacing.sm,
        fontSize: 14,
    },
    chevron: {
        position: 'absolute',
        right: spacing.sm,
        top: '25%',
        marginTop: -10,
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
    },
    actionDivider: {
        width: 1,
        height: 16,
        backgroundColor: colors.divider,
        marginHorizontal: spacing.xs,
    },
});
