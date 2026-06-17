import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    bulkSendMessage,
    type ActiveUser,
    type ChatBatch,
    type ChatStudent,
} from '@/src/api/chat.api';
import AppText from '@/src/components/common/AppText';
import {
    useInfiniteChatBatches,
    useInfiniteChatStudents,
    useInfiniteChatUsers,
} from '@/src/queries/chat.query';
import { colors } from '@/src/theme';

export type ForwardMessageModalProps = {
    visible: boolean;
    messageContent: string | null;
    messageType: string;
    messageFileUrl?: string | null;
    messageFileName?: string | null;
    onClose: () => void;
    onForwardSuccess?: () => void;
};

type RecipientTab = 'users' | 'students' | 'batches';
type RecipientItem = (ActiveUser | ChatStudent | ChatBatch) & { _type: RecipientTab };

export default function ForwardMessageModal({
    visible,
    messageContent,
    messageType,
    messageFileUrl,
    messageFileName,
    onClose,
    onForwardSuccess,
}: ForwardMessageModalProps) {
    const insets = useSafeAreaInsets();
    const [tab, setTab] = useState<RecipientTab>('users');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedItems, setSelectedItems] = useState<Map<string | number, RecipientItem>>(new Map());
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setTab('users');
            setSearch('');
            setDebouncedSearch('');
            setSelectedItems(new Map());
            setIsSending(false);
        }
    }, [visible]);

    const {
        data: usersData,
        isLoading: usersLoading,
        isFetchingNextPage: usersFetchingNextPage,
        hasNextPage: usersHasNextPage,
        fetchNextPage: fetchMoreUsers,
    } = useInfiniteChatUsers({
        search: tab === 'users' ? debouncedSearch : '',
        pageSize: 30,
        enabled: visible && tab === 'users',
    });

    const {
        data: studentsData,
        isLoading: studentsLoading,
        isFetchingNextPage: studentsFetchingNextPage,
        hasNextPage: studentsHasNextPage,
        fetchNextPage: fetchMoreStudents,
    } = useInfiniteChatStudents({
        search: tab === 'students' ? debouncedSearch : '',
        pageSize: 30,
        enabled: visible && tab === 'students',
    });

    const {
        data: batchesData,
        isLoading: batchesLoading,
        isFetchingNextPage: batchesFetchingNextPage,
        hasNextPage: batchesHasNextPage,
        fetchNextPage: fetchMoreBatches,
    } = useInfiniteChatBatches({
        search: tab === 'batches' ? debouncedSearch : '',
        pageSize: 30,
        enabled: visible && tab === 'batches',
    });

    const listData = useMemo(() => {
        if (tab === 'users') {
            return (usersData?.pages.flatMap((p: any) => p.users || p.results || p.data?.users || p.data?.results || []) || []).map((i: any) => ({ ...i, _type: 'users' }));
        }
        if (tab === 'students') {
            return (studentsData?.pages.flatMap((p: any) => p.students || p.results || p.data?.students || p.data?.results || []) || []).map((i: any) => ({ ...i, _type: 'students' }));
        }
        return (batchesData?.pages.flatMap((p: any) => p.batches || p.results || p.data?.batches || p.data?.results || []) || []).map((i: any) => ({ ...i, _type: 'batches' }));
    }, [batchesData, studentsData, tab, usersData]);

    const isLoading =
        (tab === 'users' && usersLoading) ||
        (tab === 'students' && studentsLoading) ||
        (tab === 'batches' && batchesLoading);

    const isFetchingNextPage =
        (tab === 'users' && usersFetchingNextPage) ||
        (tab === 'students' && studentsFetchingNextPage) ||
        (tab === 'batches' && batchesFetchingNextPage);

    const loadMore = useCallback(() => {
        if (tab === 'users' && usersHasNextPage && !usersFetchingNextPage) void fetchMoreUsers();
        else if (tab === 'students' && studentsHasNextPage && !studentsFetchingNextPage) void fetchMoreStudents();
        else if (tab === 'batches' && batchesHasNextPage && !batchesFetchingNextPage) void fetchMoreBatches();
    }, [
        batchesFetchingNextPage, batchesHasNextPage, fetchMoreBatches,
        fetchMoreStudents, fetchMoreUsers, studentsFetchingNextPage,
        studentsHasNextPage, tab, usersFetchingNextPage, usersHasNextPage,
    ]);

    const getIdentifier = (item: RecipientItem): string | number => {
        if (item._type === 'batches') return item.uid || '';
        const id = 'user_id' in item ? item.user_id || item.id || '' : item.id || '';
        return id as string | number;
    };

    const getRecipientName = (item: RecipientItem) => {
        if (item._type === 'batches') {
            if ('batch_name' in item && typeof item.batch_name === 'string' && item.batch_name) return item.batch_name;
            if ('name' in item && typeof item.name === 'string' && item.name) return item.name;
            return 'Batch';
        }
        if ('full_name' in item && typeof item.full_name === 'string' && item.full_name) return item.full_name;
        if ('name' in item && typeof item.name === 'string' && item.name) return item.name;
        return 'Unknown';
    };

    const getRecipientSubtitle = (item: RecipientItem) => {
        if (item._type === 'batches') return 'Batch';
        if ('email' in item && typeof item.email === 'string' && item.email) return item.email;
        if ('phone' in item && typeof item.phone === 'string' && item.phone) return item.phone;
        if ('student_id' in item && typeof item.student_id === 'string' && item.student_id) return item.student_id;
        return '';
    };

    const toggleSelection = useCallback((item: RecipientItem) => {
        const id = getIdentifier(item);
        if (!id) return;

        setSelectedItems((prev) => {
            const next = new Map(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.set(id, item);
            }
            return next;
        });
    }, []);

    const handleForward = useCallback(async () => {
        if (selectedItems.size === 0 || !messageContent || isSending) return;

        const items = Array.from(selectedItems.values());
        const userIds: number[] = [];
        const batchUids: string[] = [];

        items.forEach((item) => {
            if (item._type === 'batches' && item.uid) {
                batchUids.push(item.uid);
            } else {
                const id = 'user_id' in item ? item.user_id : item.id;
                if (typeof id === 'number') userIds.push(id);
            }
        });

        try {
            setIsSending(true);
            await bulkSendMessage({
                batch_uids: batchUids,
                chat_uids: [],
                content: messageContent,
                message_type: messageType,
                file_url: messageFileUrl ?? undefined,
                file: messageFileUrl ?? undefined,
                attachment_url: messageFileUrl ?? undefined,
                file_name: messageFileName ?? undefined,
                original_filename: messageFileName ?? undefined,
                user_ids: userIds,
            });

            if (onForwardSuccess) {
                onForwardSuccess();
            }
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || 'Failed to forward message';
            Alert.alert('Error', msg);
        } finally {
            setIsSending(false);
        }
    }, [selectedItems, messageContent, isSending, messageType, messageFileUrl, messageFileName, onForwardSuccess, onClose]);

    const selectedCount = selectedItems.size;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleWrap}>
                            <AppText variant="subtitle">Forward Message</AppText>
                            {selectedCount > 0 && (
                                <View style={styles.countBadge}>
                                    <AppText variant="caption" color={colors.surface} style={{ fontSize: 10 }}>
                                        {selectedCount}
                                    </AppText>
                                </View>
                            )}
                        </View>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={styles.tabsRow}>
                        {(['users', 'students', 'batches'] as RecipientTab[]).map((t) => (
                            <Pressable
                                key={t}
                                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                                onPress={() => {
                                    setTab(t);
                                    setSearch('');
                                }}
                            >
                                <AppText
                                    variant="caption"
                                    color={tab === t ? colors.surface : colors.textSecondary}
                                    style={tab === t ? { fontWeight: '600' } : {}}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </AppText>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.searchWrap}>
                        <Ionicons name="search" size={16} color={colors.textSecondary} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder={`Search ${tab}`}
                            style={styles.searchInput}
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    {isLoading ? (
                        <View style={styles.loaderWrap}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={listData as RecipientItem[]}
                            keyExtractor={(item, index) => String(getIdentifier(item) || index)}
                            contentContainerStyle={styles.list}
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.5}
                            renderItem={({ item }) => {
                                const id = getIdentifier(item);
                                const isSelected = id ? selectedItems.has(id) : false;
                                const name = getRecipientName(item);
                                const initial = name.charAt(0).toUpperCase() || '?';

                                return (
                                    <Pressable
                                        style={styles.listItem}
                                        onPress={() => toggleSelection(item)}
                                    >
                                        <View style={styles.avatarWrap}>
                                            <AppText variant="subtitle" color={colors.primary}>
                                                {initial}
                                            </AppText>
                                        </View>
                                        <View style={styles.textWrap}>
                                            <AppText variant="body" numberOfLines={1}>
                                                {name}
                                            </AppText>
                                            {getRecipientSubtitle(item) ? (
                                                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                                                    {getRecipientSubtitle(item)}
                                                </AppText>
                                            ) : null}
                                        </View>
                                        <View style={styles.checkboxWrap}>
                                            {isSelected ? (
                                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                            ) : (
                                                <Ionicons name="ellipse-outline" size={24} color={colors.border} />
                                            )}
                                        </View>
                                    </Pressable>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={styles.emptyWrap}>
                                    <AppText color={colors.textSecondary}>No results</AppText>
                                </View>
                            }
                            ListFooterComponent={
                                isFetchingNextPage ? (
                                    <ActivityIndicator color={colors.primary} style={{ padding: 16 }} />
                                ) : null
                            }
                        />
                    )}

                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        <Pressable
                            style={[
                                styles.forwardBtn,
                                (selectedCount === 0 || isSending) && styles.forwardBtnDisabled,
                            ]}
                            onPress={handleForward}
                            disabled={selectedCount === 0 || isSending}
                        >
                            {isSending ? (
                                <ActivityIndicator color={colors.surface} size="small" />
                            ) : (
                                <>
                                    <AppText color={colors.surface} style={{ fontWeight: '600' }}>
                                        Forward Message
                                    </AppText>
                                    <Ionicons name="send" size={16} color={colors.surface} style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    card: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countBadge: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    tabsRow: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: colors.background,
    },
    tabBtnActive: {
        backgroundColor: colors.primary,
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 12,
        backgroundColor: colors.background,
        borderRadius: 8,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        color: colors.textPrimary,
        fontSize: 14,
    },
    loaderWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    avatarWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight + '30',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textWrap: {
        flex: 1,
    },
    checkboxWrap: {
        marginLeft: 12,
    },
    emptyWrap: {
        flex: 1,
        paddingTop: 40,
        alignItems: 'center',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        padding: 16,
        backgroundColor: colors.surface,
    },
    forwardBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    forwardBtnDisabled: {
        opacity: 0.5,
    },
});
