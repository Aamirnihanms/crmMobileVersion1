import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    addMembersToGroup,
    demoteAdminToMember,
    generatePresignedUploadUrl,
    getGroupDetails,
    getUploadedFileUrl,
    leaveGroup,
    promoteMemberToAdmin,
    removeMembersFromGroup,
    updateGroupInfo,
    uploadFileToPresignedPost,
    type ChatParticipant,
} from '@/src/api/chat.api';
import AddMembersModal from '@/src/components/chat/AddMembersModal';
import AppModal from '@/src/components/common/AppModal';
import AppText from '@/src/components/common/AppText';
import type { DashboardStackParamList } from '@/src/navigation/DashboardStack';
import { useAppTheme } from '@/src/theme';

type GroupDetailsRouteProp = RouteProp<DashboardStackParamList, 'GroupDetails'>;

type ParticipantWithRole = ChatParticipant & {
    role: 'admin' | 'member';
    joined_at?: string;
};

export default function GroupDetailsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
    const route = useRoute<GroupDetailsRouteProp>();
    const queryClient = useQueryClient();
    const { chatId, chatType } = route.params;

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const { data: groupData, isLoading, refetch } = useQuery({
        queryKey: ['group-details', chatId],
        queryFn: () => getGroupDetails(chatId),
        enabled: !!chatId,
    });

    const participants = useMemo(() => {
        if (!groupData) return [];
        const admins = (groupData.admins || []).map((a: any) => ({ ...a, role: 'admin' }));
        const members = (groupData.members || []).map((m: any) => ({ ...m, role: 'member' }));
        return [...admins, ...members] as ParticipantWithRole[];
    }, [groupData]);

    const currentUserRole = groupData?.current_user_role || 'member';
    const isAdmin = currentUserRole === 'admin';

    const handleLeaveGroup = async () => {
        Alert.alert(
            'Leave Group',
            'Are you sure you want to leave this group?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await leaveGroup(chatId);
                            queryClient.invalidateQueries({ queryKey: ['chat-list'] });
                            navigation.navigate('DashboardHome');
                        } catch (err: any) {
                            Alert.alert('Error', err?.message || 'Failed to leave group');
                        }
                    },
                },
            ]
        );
    };

    const handleAddMembers = async (userIds: number[]) => {
        try {
            setIsUpdating(true);
            await addMembersToGroup(chatId, { user_ids: userIds });
            await refetch();
            setIsAddModalVisible(false);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to add members');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveMember = (participant: ParticipantWithRole) => {
        if (!isAdmin) return;
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${participant.full_name || participant.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeMembersFromGroup(chatId, { user_ids: [participant.id] });
                            await refetch();
                        } catch (err: any) {
                            Alert.alert('Error', err?.message || 'Failed to remove member');
                        }
                    },
                },
            ]
        );
    };

    const handleToggleAdmin = async (participant: ParticipantWithRole) => {
        if (!isAdmin) return;
        try {
            if (participant.role === 'admin') {
                await demoteAdminToMember(chatId, { user_id: participant.id });
            } else {
                await promoteMemberToAdmin(chatId, { user_id: participant.id });
            }
            await refetch();
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to change admin status');
        }
    };

    const handleUpdateGroupInfo = async () => {
        try {
            setIsUpdating(true);
            await updateGroupInfo(chatId, {
                group_name: editName,
                group_description: editDescription,
            });
            await refetch();
            setIsEditModalVisible(false);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to update group info');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateIcon = async () => {
        if (!isAdmin) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.length) return;

        try {
            setIsUpdating(true);
            const asset = result.assets[0];
            const presigned = await generatePresignedUploadUrl({
                file_name: `group-icon-${chatId}-${Date.now()}.jpg`,
                folder: 'group-icons',
            });

            if (!presigned?.success) throw new Error('Failed to get upload URL');

            await uploadFileToPresignedPost(presigned, {
                uri: asset.uri,
                name: asset.fileName || 'icon.jpg',
                type: asset.mimeType || 'image/jpeg',
            });

            const iconUrl = getUploadedFileUrl(presigned);
            if (!iconUrl) throw new Error('Failed to get icon URL');

            await updateGroupInfo(chatId, { group_icon: iconUrl });
            await refetch();
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to update group icon');
        } finally {
            setIsUpdating(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
                <Pressable onPress={handleUpdateIcon} disabled={!isAdmin}>
                    <View style={styles.iconWrapper}>
                        {groupData?.group_icon ? (
                            <ExpoImage
                                source={{ uri: groupData.group_icon }}
                                style={styles.groupIcon}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={[styles.groupIcon, styles.placeholderIcon]}>
                                <Ionicons name="people" size={60} color={colors.primary} />
                            </View>
                        )}
                        {isAdmin && (
                            <View style={styles.editIconBadge}>
                                <Ionicons name="camera" size={20} color={colors.surface} />
                            </View>
                        )}
                    </View>
                </Pressable>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                    <AppText variant="h2" style={styles.groupName}>{groupData?.group_name || 'Group'}</AppText>
                    {isAdmin && (
                        <Pressable
                            onPress={() => {
                                setEditName(groupData?.group_name || '');
                                setEditDescription(groupData?.group_description || '');
                                setIsEditModalVisible(true);
                            }}
                            style={styles.editBtn}
                        >
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </Pressable>
                    )}
                </View>
                {groupData?.group_description && (
                    <AppText color={colors.textSecondary} style={styles.descriptionText}>
                        {groupData.group_description}
                    </AppText>
                )}
                <AppText variant="caption" color={colors.textMuted} style={styles.statsText}>
                    {groupData?.participant_count || 0} participants • {groupData?.admin_count || 0} admins
                </AppText>
            </View>

            {isAdmin && (
                <Pressable
                    style={styles.actionRow}
                    onPress={() => setIsAddModalVisible(true)}
                >
                    <View style={styles.actionIcon}>
                        <Ionicons name="person-add" size={20} color={colors.primary} />
                    </View>
                    <AppText color={colors.primary} style={{ fontWeight: '600' }}>Add Members</AppText>
                </Pressable>
            )}
        </View>
    );

    const renderParticipant = ({ item }: { item: ParticipantWithRole }) => (
        <Pressable
            style={styles.participantItem}
            onLongPress={() => {
                if (!isAdmin || item.id === groupData?.current_user_id) return;
                Alert.alert(
                    'Member Options',
                    `Manage ${item.full_name || item.name}`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: item.role === 'admin' ? 'Dismiss as Admin' : 'Make Group Admin', onPress: () => handleToggleAdmin(item) },
                        { text: 'Remove from Group', style: 'destructive', onPress: () => handleRemoveMember(item) },
                    ]
                );
            }}
        >
            <View style={styles.participantAvatar}>
                {item.profile_pic ? (
                    <ExpoImage
                        source={{ uri: item.profile_pic }}
                        style={styles.avatarImg}
                        contentFit="cover"
                    />
                ) : (
                    <AppText variant="subtitle" color={colors.primary}>
                        {(item.full_name || item.name || 'U').charAt(0).toUpperCase()}
                    </AppText>
                )}
            </View>
            <View style={styles.participantInfo}>
                <AppText style={styles.participantName}>{item.full_name || item.name}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>{item.email || ''}</AppText>
            </View>
            {item.role === 'admin' && (
                <View style={styles.adminBadge}>
                    <AppText style={styles.adminBadgeText}>Admin</AppText>
                </View>
            )}
        </Pressable>
    );

    if (isLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <FlatList
                data={participants}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderParticipant}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={() => (
                    <View style={styles.footer}>
                        <Pressable style={styles.leaveBtn} onPress={handleLeaveGroup}>
                            <Ionicons name="log-out-outline" size={24} color={colors.danger} />
                            <AppText color={colors.danger} style={styles.leaveText}>Leave Group</AppText>
                        </Pressable>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />

            <AddMembersModal
                visible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                onAdd={handleAddMembers}
                isAdding={isUpdating}
                existingMemberIds={participants.map(p => p.id as number)}
            />

            <AppModal statusBarTranslucent navigationBarTranslucent
                visible={isEditModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <AppText variant="subtitle" style={styles.modalTitle}>Edit Group Info</AppText>

                        <AppText variant="caption" color={colors.textSecondary} style={styles.inputLabel}>Group Name</AppText>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter group name"
                        />

                        <AppText variant="caption" color={colors.textSecondary} style={styles.inputLabel}>Description</AppText>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder="Enter group description"
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.modalActions}>
                            <Pressable
                                style={[styles.modalBtn, styles.cancelModalBtn]}
                                onPress={() => setIsEditModalVisible(false)}
                            >
                                <AppText>Cancel</AppText>
                            </Pressable>
                            <Pressable
                                style={[styles.modalBtn, styles.saveModalBtn]}
                                onPress={handleUpdateGroupInfo}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color={colors.surface} />
                                ) : (
                                    <AppText color={colors.surface} style={{ fontWeight: '600' }}>Save</AppText>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </AppModal>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 40,
    },
    headerSection: {
        backgroundColor: colors.surface,
        paddingVertical: 30,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: 10,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconWrapper: {
        position: 'relative',
    },
    groupIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    placeholderIcon: {
        backgroundColor: colors.primaryLight + '30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.surface,
    },
    infoContainer: {
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 20,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    groupName: {
        fontWeight: '800',
        textAlign: 'center',
    },
    editBtn: {
        marginLeft: 10,
        padding: 5,
    },
    descriptionText: {
        textAlign: 'center',
        marginBottom: 8,
    },
    statsText: {
        fontSize: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 25,
        backgroundColor: colors.primaryLight + '20',
        borderRadius: 25,
    },
    actionIcon: {
        marginRight: 10,
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    participantAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryLight + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    participantInfo: {
        flex: 1,
    },
    participantName: {
        fontWeight: '600',
        fontSize: 16,
    },
    adminBadge: {
        backgroundColor: colors.primaryLight + '50',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 5,
    },
    adminBadgeText: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '700',
    },
    footer: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    leaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.danger + '30',
    },
    leaveText: {
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 25,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontWeight: '800',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputLabel: {
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 15,
    },
    modalBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelModalBtn: {
        backgroundColor: colors.surfaceSubtle,
    },
    saveModalBtn: {
        backgroundColor: colors.primary,
    },
});
