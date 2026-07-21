import AppModal from '@/src/components/common/AppModal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';

import VideoPlayerModal from '../../../components/gallery/VideoPlayerModal';

import AppCard from '../../../components/common/AppCard';
import AppText from '../../../components/common/AppText';
import EmptyState from '../../../components/common/EmptyState';
import { MoreStackParamList } from '../../../navigation/MoreStack';
import { useDeleteFolder, useDeleteVideo, useGalleryFolders, useGalleryVideos, useUpdateVideo } from '../../../queries/gallery.query';
import { useAppTheme, spacing } from '../../../theme';
import { getYouTubeID } from '../../../utils/youtube';

export default function GalleryContentsTab({ uid }: { uid: string }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

    const {
        data: folders,
        isLoading: foldersLoading,
        refetch: refetchFolders,
        isRefetching: foldersRefetching
    } = useGalleryFolders({ gallery_uid: uid });

    const {
        data: videosData,
        isLoading: videosLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch: refetchVideos,
        isRefetching: videosRefetching
    } = useGalleryVideos({ gallery_uid: uid, without_folder: true });

    const deleteVideoMutation = useDeleteVideo();
    const deleteFolderMutation = useDeleteFolder();
    const updateVideoMutation = useUpdateVideo();

    const [isMoveModalVisible, setIsMoveModalVisible] = React.useState(false);
    const [selectedVideo, setSelectedVideo] = React.useState<any>(null);
    const [isVideoPlayerVisible, setIsVideoPlayerVisible] = React.useState(false);
    const [activeVideoId, setActiveVideoId] = React.useState<string | null>(null);
    const [activeVideoTitle, setActiveVideoTitle] = React.useState<string>('');

    const videos = videosData?.pages.flatMap(page => page.videos) || [];

    const onRefresh = () => {
        refetchFolders();
        refetchVideos();
    };

    const isRefetching = foldersRefetching || videosRefetching;
    const isLoading = foldersLoading || videosLoading;

    const handlePlayVideo = (url: string, title: string) => {
        const videoId = getYouTubeID(url);
        if (videoId) {
            setActiveVideoId(videoId);
            setActiveVideoTitle(title);
            setIsVideoPlayerVisible(true);
        } else {
            // Fallback to external browser if it's not a recognized YouTube URL
            Linking.openURL(url).catch(() => {
                Alert.alert('Error', 'Cannot open this URL');
            });
        }
    };

    const handleDeleteVideo = (videoUid: string) => {
        Alert.alert(
            'Delete Video',
            'Are you sure you want to delete this video?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteVideoMutation.mutateAsync(videoUid);
                            Alert.alert('Success', 'Video deleted successfully');
                        } catch (error: any) {
                            const message = error.response?.data?.message || error.message || 'Failed to delete video';
                            Alert.alert('Error', message);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteFolder = (folderUid: string) => {
        Alert.alert(
            'Delete Folder',
            'Are you sure you want to delete this folder and all its contents?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteFolderMutation.mutateAsync(folderUid);
                            Alert.alert('Success', 'Folder deleted successfully');
                        } catch (error: any) {
                            const message = error.response?.data?.message || error.message || 'Failed to delete folder';
                            Alert.alert('Error', message);
                        }
                    }
                }
            ]
        );
    };

    const handleMoveVideo = async (folderUid: string | null) => {
        if (!selectedVideo) return;

        try {
            await updateVideoMutation.mutateAsync({
                uid: selectedVideo.uid,
                payload: { folder: folderUid }
            });
            Alert.alert('Success', 'Video moved successfully');
            setIsMoveModalVisible(false);
            setSelectedVideo(null);
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to move video';
            Alert.alert('Error', message);
        }
    };

    const renderFolder = ({ item }: { item: any }) => (
        <AppCard style={styles.contentCard}>
            <Pressable
                onPress={() => navigation.navigate('FolderDetail', { uid: item.uid, gallery_uid: uid })}
                style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name="folder" size={24} color="#FFCA28" />
                </View>
                <View style={styles.info}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }}>{item.name}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                        {item.videos_count} videos • {item.subfolders_count} subfolders
                    </AppText>
                </View>
            </Pressable>
            <View style={styles.actionButtons}>
                <Pressable
                    onPress={() => navigation.navigate('CreateFolder', { gallery_uid: uid, folder: item })}
                    style={styles.actionIcon}
                >
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                </Pressable>
                <Pressable
                    onPress={() => handleDeleteFolder(item.uid)}
                    style={styles.actionIcon}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
            </View>
        </AppCard>
    );

    const renderVideo = ({ item }: { item: any }) => (
        <AppCard style={styles.contentCard}>
            <Pressable
                style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
                onPress={() => handlePlayVideo(item.video_url, item.title)}
            >
                <View style={[styles.iconContainer, { backgroundColor: colors.info + '15' }]}>
                    <Ionicons name="play-circle" size={24} color={colors.info} />
                </View>
                <View style={styles.info}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }}>{item.title}</AppText>
                    <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
                        {item.description || 'No description'}
                    </AppText>
                </View>
            </Pressable>
            <View style={styles.actionButtons}>
                <Pressable
                    onPress={() => {
                        setSelectedVideo(item);
                        setIsMoveModalVisible(true);
                    }}
                    style={styles.actionIcon}
                >
                    <Ionicons name="folder-open-outline" size={20} color={colors.warning} />
                </Pressable>
                <Pressable
                    onPress={() => navigation.navigate('AddVideo', { gallery_uid: uid, video: item })}
                    style={styles.actionIcon}
                >
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                </Pressable>
                <Pressable
                    onPress={() => handleDeleteVideo(item.uid)}
                    style={styles.actionIcon}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
            </View>
        </AppCard>
    );

    if (isLoading && !isRefetching) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const sections = [
        ...(folders || []).filter(f => !f.parent_folder).map(f => ({ ...f, type: 'folder' })),
        ...videos.map(v => ({ ...v, type: 'video' }))
    ];

    return (
        <View style={styles.container}>
            <View style={styles.actionHeader}>
                <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#FFCA2820' }]}
                    onPress={() => navigation.navigate('CreateFolder', { gallery_uid: uid })}
                >
                    <Ionicons name="add-circle-outline" size={20} color="#FFCA28" />
                    <AppText variant="caption" style={styles.actionText}>New Folder</AppText>
                </Pressable>
                <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.info + '15' }]}
                    onPress={() => navigation.navigate('AddVideo', { gallery_uid: uid })}
                >
                    <Ionicons name="videocam" size={20} color={colors.info} />
                    <AppText variant="caption" style={styles.actionText}>Add Video</AppText>
                </Pressable>
            </View>

            <FlatList
                data={sections}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) => item.type === 'folder' ? renderFolder({ item }) : renderVideo({ item })}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} /> : null}
                ListEmptyComponent={
                    <EmptyState
                        icon="folder-open-outline"
                        title="Gallery is Empty"
                        description="There are no folders or videos at the top level of this gallery."
                    />
                }
            />

            <AppModal statusBarTranslucent navigationBarTranslucent
                visible={isMoveModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsMoveModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h3">Move Video to Folder</AppText>
                            <Pressable onPress={() => setIsMoveModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </Pressable>
                        </View>

                        <FlatList
                            data={[{ uid: null, name: 'Root Gallery' }, ...(folders || [])]}
                            keyExtractor={(item) => item.uid || 'root'}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.folderItem}
                                    onPress={() => handleMoveVideo(item.uid)}
                                >
                                    <Ionicons name={item.uid ? "folder" : "images"} size={20} color={item.uid ? "#FFCA28" : colors.primary} />
                                    <AppText style={styles.folderName}>{item.name}</AppText>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                                </Pressable>
                            )}
                            ListEmptyComponent={<AppText style={{ textAlign: 'center', padding: 20 }}>No folders found</AppText>}
                        />
                    </View>
                </View>
            </AppModal>

            <VideoPlayerModal
                isVisible={isVideoPlayerVisible}
                videoId={activeVideoId}
                title={activeVideoTitle}
                onClose={() => {
                    setIsVideoPlayerVisible(false);
                    setActiveVideoId(null);
                }}
            />
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    list: {
        padding: spacing.md,
        paddingTop: spacing.xs,
    },
    actionHeader: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.md,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: 12,
        gap: spacing.xs,
    },
    actionText: {
        fontWeight: '700',
        color: colors.textPrimary,
    },
    contentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFCA2820',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    info: {
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    actionIcon: {
        padding: spacing.xs,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    folderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    folderName: {
        flex: 1,
        marginLeft: spacing.md,
        fontWeight: '600',
    },
});
