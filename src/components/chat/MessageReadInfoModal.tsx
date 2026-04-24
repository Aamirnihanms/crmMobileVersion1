import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

import { getMessageReadInfo } from '@/src/api/chat.api';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';

type ReadByUser = {
    user_id: number;
    user_name: string;
    user_email: string;
    profile_pic: string | null;
    read_at: string;
};

type MessageReadInfoResponse = {
    status: string;
    message_uid: string;
    read_by: ReadByUser[];
    total_read: number;
};

interface MessageReadInfoModalProps {
    visible: boolean;
    onClose: () => void;
    chatUid: string;
    messageUid: string;
}

const formatReadTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    if (isToday) {
        return timeStr;
    }

    const dateStr = date.toLocaleDateString([], {
        day: 'numeric',
        month: 'short',
    });

    return `${dateStr}, ${timeStr}`;
};

const MessageReadInfoModal: React.FC<MessageReadInfoModalProps> = ({
    visible,
    onClose,
    chatUid,
    messageUid,
}) => {
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState<MessageReadInfoResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && chatUid && messageUid) {
            void fetchReadInfo();
        } else {
            setInfo(null);
            setError(null);
        }
    }, [visible, chatUid, messageUid]);

    const fetchReadInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMessageReadInfo(chatUid, messageUid);
            setInfo(data);
        } catch (err) {
            console.error('Error fetching read info:', err);
            setError('Failed to load read information');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: ReadByUser }) => (
        <View style={styles.userRow}>
            <View style={styles.avatarContainer}>
                {item.profile_pic ? (
                    <ExpoImage
                        source={{ uri: item.profile_pic }}
                        style={styles.avatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <View style={styles.placeholderAvatar}>
                        <Ionicons name="person" size={20} color={colors.primary} />
                    </View>
                )}
            </View>
            <View style={styles.userInfo}>
                <AppText variant="body" style={styles.userName}>
                    {item.user_name}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                    {item.user_email}
                </AppText>
            </View>
            <View style={styles.timeInfo}>
                <AppText variant="caption" color={colors.textMuted} style={styles.readAtLabel}>
                    Read
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                    {formatReadTime(item.read_at)}
                </AppText>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.dismissArea} onPress={onClose} />
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textPrimary} />
                        </Pressable>
                        <AppText variant="h3" style={styles.title}>
                            Message Info
                        </AppText>
                        <View style={{ width: 40 }} />
                    </View>

                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : error ? (
                        <View style={styles.centerContent}>
                            <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                            <AppText style={styles.errorText}>{error}</AppText>
                            <Pressable style={styles.retryButton} onPress={fetchReadInfo}>
                                <AppText color={colors.surface}>Retry</AppText>
                            </Pressable>
                        </View>
                    ) : info?.read_by && info.read_by.length > 0 ? (
                        <FlatList
                            data={info.read_by}
                            keyExtractor={(item) => String(item.user_id)}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    ) : (
                        <View style={styles.centerContent}>
                            <Ionicons name="checkmark-done" size={48} color={colors.textMuted} />
                            <AppText variant="body" color={colors.textMuted}>
                                No one has read this message yet.
                            </AppText>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '70%',
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    closeButton: {
        padding: spacing.xs,
    },
    title: {
        fontWeight: '700',
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    listContent: {
        padding: spacing.md,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    avatarContainer: {
        marginRight: spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    placeholderAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryLight + '30',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontWeight: '600',
        marginBottom: 2,
    },
    timeInfo: {
        alignItems: 'flex-end',
    },
    readAtLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        marginBottom: 2,
        fontWeight: '700',
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.xs,
        marginLeft: 60,
    },
    errorText: {
        marginTop: spacing.md,
        textAlign: 'center',
        color: colors.textSecondary,
    },
    retryButton: {
        marginTop: spacing.lg,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: 8,
    },
});

export default MessageReadInfoModal;
