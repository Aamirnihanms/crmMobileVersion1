import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    type ActiveUser,
    type ChatStudent,
} from '@/src/api/chat.api';
import AppText from '@/src/components/common/AppText';
import {
    useInfiniteChatStudents,
    useInfiniteChatUsers,
} from '@/src/queries/chat.query';
import { colors } from '@/src/theme';

export type AddMembersModalProps = {
    visible: boolean;
    onClose: () => void;
    onAdd: (userIds: number[]) => void;
    isAdding?: boolean;
    existingMemberIds?: number[];
};

type RecipientTab = 'users' | 'students';
type RecipientItem = (ActiveUser | ChatStudent) & { _type: RecipientTab };

export default function AddMembersModal({
    visible,
    onClose,
    onAdd,
    isAdding,
    existingMemberIds = [],
}: AddMembersModalProps) {
    const insets = useSafeAreaInsets();
    const [tab, setTab] = useState<RecipientTab>('users');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedItems, setSelectedItems] = useState<Map<number, RecipientItem>>(new Map());

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (visible) {
            setSearch('');
            setDebouncedSearch('');
            setSelectedItems(new Map());
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

    const listData = useMemo(() => {
        let items: any[] = [];
        if (tab === 'users') {
            items = usersData?.pages.flatMap((p: any) => p.users || p.results || p.data?.users || p.data?.results || []) || [];
            return items.map((i: any) => ({ ...i, _type: 'users' }));
        }
        items = studentsData?.pages.flatMap((p: any) => p.students || p.results || p.data?.students || p.data?.results || []) || [];
        return items.map((i: any) => ({ ...i, _type: 'students' }));
    }, [studentsData, tab, usersData]);

    const isLoading = (tab === 'users' && usersLoading) || (tab === 'students' && studentsLoading);
    const isFetchingNextPage = (tab === 'users' && usersFetchingNextPage) || (tab === 'students' && studentsFetchingNextPage);

    const loadMore = useCallback(() => {
        if (tab === 'users' && usersHasNextPage && !usersFetchingNextPage) void fetchMoreUsers();
        else if (tab === 'students' && studentsHasNextPage && !studentsFetchingNextPage) void fetchMoreStudents();
    }, [fetchMoreStudents, fetchMoreUsers, studentsFetchingNextPage, studentsHasNextPage, tab, usersFetchingNextPage, usersHasNextPage]);

    const getUserId = (item: RecipientItem): number | null => {
        const id = 'user_id' in item ? item.user_id : item.id;
        return typeof id === 'number' ? id : null;
    };

    const toggleSelection = useCallback((item: RecipientItem) => {
        const id = getUserId(item);
        if (id === null || existingMemberIds.includes(id)) return;

        setSelectedItems((prev) => {
            const next = new Map(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.set(id, item);
            }
            return next;
        });
    }, [existingMemberIds]);

    const handleAdd = useCallback(() => {
        if (selectedItems.size === 0) return;
        onAdd(Array.from(selectedItems.keys()));
    }, [onAdd, selectedItems]);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleWrap}>
                            <AppText variant="subtitle">Add Members</AppText>
                            {selectedItems.size > 0 && (
                                <View style={styles.countBadge}>
                                    <AppText variant="caption" color="#FFFFFF" style={{ fontSize: 10 }}>
                                        {selectedItems.size}
                                    </AppText>
                                </View>
                            )}
                        </View>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={styles.tabsRow}>
                        {(['users', 'students'] as RecipientTab[]).map((t) => (
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
                                    color={tab === t ? '#FFFFFF' : colors.textSecondary}
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
                            keyExtractor={(item, index) => String(getUserId(item) || index)}
                            contentContainerStyle={styles.list}
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.5}
                            renderItem={({ item }) => {
                                const id = getUserId(item);
                                const isSelected = id !== null && selectedItems.has(id);
                                const isAlreadyMember = id !== null && existingMemberIds.includes(id);
                                const name = item.full_name || item.name || 'Unknown';
                                const profilePic = item.profile_pic;

                                return (
                                    <Pressable
                                        style={[styles.listItem, isAlreadyMember && styles.listItemDisabled]}
                                        onPress={() => toggleSelection(item)}
                                        disabled={isAlreadyMember}
                                    >
                                        <View style={styles.avatarWrap}>
                                            {profilePic ? (
                                                <ExpoImage
                                                    source={{ uri: profilePic }}
                                                    style={styles.avatar}
                                                    contentFit="cover"
                                                />
                                            ) : (
                                                <AppText variant="subtitle" color={colors.primary}>
                                                    {name.charAt(0).toUpperCase()}
                                                </AppText>
                                            )}
                                        </View>
                                        <View style={styles.textWrap}>
                                            <AppText variant="body" numberOfLines={1}>
                                                {name}
                                            </AppText>
                                            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                                                {isAlreadyMember ? 'Already a member' : (item.email || item.phone || '')}
                                            </AppText>
                                        </View>
                                        {!isAlreadyMember && (
                                            <View style={styles.checkboxWrap}>
                                                {isSelected ? (
                                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                                ) : (
                                                    <Ionicons name="ellipse-outline" size={24} color={colors.border} />
                                                )}
                                            </View>
                                        )}
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
                                styles.addBtn,
                                (selectedItems.size === 0 || isAdding) && styles.addBtnDisabled,
                            ]}
                            onPress={handleAdd}
                            disabled={selectedItems.size === 0 || isAdding}
                        >
                            {isAdding ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <AppText color="#FFFFFF" style={{ fontWeight: '600' }}>
                                    Add selected ({selectedItems.size})
                                </AppText>
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
        backgroundColor: '#FFFFFF',
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
        height: 48,
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
    listItemDisabled: {
        opacity: 0.6,
    },
    avatarWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryLight + '30',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
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
        backgroundColor: '#FFFFFF',
    },
    addBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnDisabled: {
        opacity: 0.5,
    },
});
